import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Eye, 
  Crosshair, 
  Scan,
  Compass
} from 'lucide-react';
import { AstroProcessingParams, DsoRoiParams, DwarfTrackingState, DwarfTrackingConfig } from '../types/fits';

interface CanvasViewportProps {
  offscreenCanvas: HTMLCanvasElement;
  rawOffscreenCanvas: HTMLCanvasElement;
  params: AstroProcessingParams;
  pickingMask: boolean;
  onSetMaskCenter: (x: number, y: number) => void;
  pickingBackground: boolean;
  onSampleBackground: (x: number, y: number) => void;
  compareRaw: boolean;
  onCompareRawStart: () => void;
  onCompareRawEnd: () => void;
  splitView: boolean;
  imageWidth: number;
  imageHeight: number;
  dsoRoi?: DsoRoiParams;
  onUpdateRoi?: (newParams: Partial<DsoRoiParams>) => void;
  centerRoiTrigger?: number;
  trackingState?: DwarfTrackingState;
  trackingConfig?: DwarfTrackingConfig;
  onUpdateTrackingState?: (updates: Partial<DwarfTrackingState>) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  offscreenCanvas,
  rawOffscreenCanvas,
  params,
  pickingMask,
  onSetMaskCenter,
  pickingBackground,
  onSampleBackground,
  compareRaw,
  onCompareRawStart,
  onCompareRawEnd,
  splitView,
  imageWidth,
  imageHeight,
  dsoRoi,
  onUpdateRoi,
  centerRoiTrigger,
  trackingState,
  trackingConfig,
  onUpdateTrackingState,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingRoi, setIsDraggingRoi] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Split view divider ratio (0.0 - 1.0)
  const [splitDivider, setSplitDivider] = useState(0.5);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Pixel Inspector HUD
  const [hoverPixel, setHoverPixel] = useState<{
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
    lum: number;
  } | null>(null);

  // Fit image to viewport
  const fitToScreen = useCallback(() => {
    if (!containerRef.current || imageWidth === 0 || imageHeight === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pad = 36;
    const scaleX = (rect.width - pad) / imageWidth;
    const scaleY = (rect.height - pad) / imageHeight;
    const newZoom = Math.min(scaleX, scaleY, 2.5);
    setZoom(Number(newZoom.toFixed(3)));
    setPanX(0);
    setPanY(0);
  }, [imageWidth, imageHeight]);

  // Center on ROI Box with zoom multiplier
  const centerOnRoi = useCallback(() => {
    if (!containerRef.current || !dsoRoi?.enabled || imageWidth === 0 || imageHeight === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pad = 36;
    const scaleX = (rect.width - pad) / imageWidth;
    const scaleY = (rect.height - pad) / imageHeight;
    const baseZoom = Math.min(scaleX, scaleY, 2.5);
    const targetZoom = Math.min(10.0, Number((baseZoom * (dsoRoi.zoomLevel || 1)).toFixed(3)));

    setZoom(targetZoom);
    const targetPanX = -(dsoRoi.centerX - 0.5) * imageWidth * targetZoom;
    const targetPanY = -(dsoRoi.centerY - 0.5) * imageHeight * targetZoom;
    setPanX(Math.round(targetPanX));
    setPanY(Math.round(targetPanY));
  }, [dsoRoi, imageWidth, imageHeight]);

  // Center on ROI when trigger updates
  useEffect(() => {
    if (centerRoiTrigger && centerRoiTrigger > 0) {
      centerOnRoi();
    }
  }, [centerRoiTrigger, centerOnRoi]);

  // Initial fit on image change
  useEffect(() => {
    fitToScreen();
  }, [imageWidth, imageHeight, fitToScreen]);

  // Main canvas render loop
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || imageWidth === 0 || imageHeight === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const cw = Math.floor(rect.width * dpr);
    const ch = Math.floor(rect.height * dpr);

    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }

    ctx.save();
    ctx.clearRect(0, 0, cw, ch);

    const cx = cw * 0.5 + panX * dpr;
    const cy = ch * 0.5 + panY * dpr;
    const drawW = imageWidth * zoom * dpr;
    const drawH = imageHeight * zoom * dpr;
    const drawX = cx - drawW * 0.5;
    const drawY = cy - drawH * 0.5;

    ctx.imageSmoothingEnabled = zoom < 2.5;

    const activeSource = compareRaw ? rawOffscreenCanvas : offscreenCanvas;

    if (splitView && !compareRaw) {
      // Split view: Left = Raw Linear, Right = Stretched
      const splitX = drawX + drawW * splitDivider;

      // Draw Stretched full, then clip Raw onto left half
      ctx.drawImage(offscreenCanvas, drawX, drawY, drawW, drawH);

      ctx.save();
      ctx.beginPath();
      ctx.rect(drawX, drawY, Math.max(0, splitX - drawX), drawH);
      ctx.clip();
      ctx.drawImage(rawOffscreenCanvas, drawX, drawY, drawW, drawH);
      ctx.restore();

      // Draw Split divider line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.moveTo(splitX, drawY);
      ctx.lineTo(splitX, drawY + drawH);
      ctx.stroke();

      // Divider handle
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(splitX, drawY + drawH * 0.5, 8 * dpr, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.drawImage(activeSource, drawX, drawY, drawW, drawH);
    }

    // Draw Target Mask Visual Rings Overlay
    if (params.maskEnabled && !compareRaw) {
      const ar = imageWidth / imageHeight;
      const maskPixelX = drawX + params.maskX * drawW;
      const maskPixelY = drawY + params.maskY * drawH;
      const radiusPx = params.maskRadius * drawH;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.setLineDash([5 * dpr, 4 * dpr]);
      ctx.lineWidth = 1.5 * dpr;

      // Inner Target boundary
      ctx.beginPath();
      ctx.ellipse(maskPixelX, maskPixelY, radiusPx * ar, radiusPx, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Outer Feather zone
      if (params.maskFeather > 0) {
        const featherPx = (params.maskRadius + params.maskFeather) * drawH;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.beginPath();
        ctx.ellipse(maskPixelX, maskPixelY, featherPx * ar, featherPx, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Center crosshair marker
      ctx.setLineDash([]);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2 * dpr;
      const chSize = 6 * dpr;
      ctx.beginPath();
      ctx.moveTo(maskPixelX - chSize, maskPixelY);
      ctx.lineTo(maskPixelX + chSize, maskPixelY);
      ctx.moveTo(maskPixelX, maskPixelY - chSize);
      ctx.lineTo(maskPixelX, maskPixelY + chSize);
      ctx.stroke();
    }

    // Draw Astronomical DSO & Planetary ROI Reticle Overlay
    if (dsoRoi?.enabled && dsoRoi.showOverlay && !compareRaw) {
      const roiPxW = dsoRoi.width * drawW;
      const roiPxH = dsoRoi.height * drawH;
      const roiCenterScreenX = drawX + dsoRoi.centerX * drawW;
      const roiCenterScreenY = drawY + dsoRoi.centerY * drawH;
      const roiLeft = roiCenterScreenX - roiPxW * 0.5;
      const roiTop = roiCenterScreenY - roiPxH * 0.5;

      const themeColor =
        dsoRoi.targetType === 'galaxy'
          ? '#c084fc'
          : dsoRoi.targetType === 'nebula'
          ? '#34d399'
          : dsoRoi.targetType === 'cluster'
          ? '#fbbf24'
          : '#38bdf8';

      const themeFill =
        dsoRoi.targetType === 'galaxy'
          ? 'rgba(192, 132, 252, 0.08)'
          : dsoRoi.targetType === 'nebula'
          ? 'rgba(52, 211, 153, 0.08)'
          : dsoRoi.targetType === 'cluster'
          ? 'rgba(251, 191, 36, 0.08)'
          : 'rgba(56, 189, 248, 0.08)';

      // Semi-transparent target area fill
      ctx.fillStyle = themeFill;
      ctx.fillRect(roiLeft, roiTop, roiPxW, roiPxH);

      // Dashed ROI bounding box
      ctx.strokeStyle = themeColor;
      ctx.setLineDash([6 * dpr, 4 * dpr]);
      ctx.lineWidth = 1.5 * dpr;
      ctx.strokeRect(roiLeft, roiTop, roiPxW, roiPxH);

      // Precision Observatory Corner Brackets: ┌ ┐ └ ┘
      ctx.setLineDash([]);
      ctx.lineWidth = 3 * dpr;
      const cornerLen = Math.min(22 * dpr, Math.min(roiPxW, roiPxH) * 0.25);

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(roiLeft, roiTop + cornerLen);
      ctx.lineTo(roiLeft, roiTop);
      ctx.lineTo(roiLeft + cornerLen, roiTop);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(roiLeft + roiPxW - cornerLen, roiTop);
      ctx.lineTo(roiLeft + roiPxW, roiTop);
      ctx.lineTo(roiLeft + roiPxW, roiTop + cornerLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(roiLeft, roiTop + roiPxH - cornerLen);
      ctx.lineTo(roiLeft, roiTop + roiPxH);
      ctx.lineTo(roiLeft + cornerLen, roiTop + roiPxH);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(roiLeft + roiPxW - cornerLen, roiTop + roiPxH);
      ctx.lineTo(roiLeft + roiPxW, roiTop + roiPxH);
      ctx.lineTo(roiLeft + roiPxW, roiTop + roiPxH - cornerLen);
      ctx.stroke();

      // Centroid Crosshair Marker
      ctx.lineWidth = 1.5 * dpr;
      const chSize = 8 * dpr;
      ctx.beginPath();
      ctx.moveTo(roiCenterScreenX - chSize, roiCenterScreenY);
      ctx.lineTo(roiCenterScreenX + chSize, roiCenterScreenY);
      ctx.moveTo(roiCenterScreenX, roiCenterScreenY - chSize);
      ctx.lineTo(roiCenterScreenX, roiCenterScreenY + chSize);
      ctx.stroke();

      // Target type icon & label banner tag above ROI box
      const targetLabel =
        dsoRoi.targetType === 'galaxy'
          ? `GALAXY CORE ROI [${dsoRoi.zoomLevel}×]`
          : dsoRoi.targetType === 'nebula'
          ? `NEBULA ENVELOPE [${dsoRoi.zoomLevel}×]`
          : dsoRoi.targetType === 'cluster'
          ? `STAR CLUSTER CORE [${dsoRoi.zoomLevel}×]`
          : `PLANET DISC ROI [${dsoRoi.zoomLevel}×]`;

      const fontSize = Math.max(10, Math.floor(10.5 * dpr));
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
      const textMetrics = ctx.measureText(targetLabel);
      const tagW = textMetrics.width + 16 * dpr;
      const tagH = 19 * dpr;
      const tagX = roiLeft;
      const tagY = Math.max(6 * dpr, roiTop - tagH - 4 * dpr);

      ctx.fillStyle = '#090d16ee';
      ctx.fillRect(tagX, tagY, tagW, tagH);
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1 * dpr;
      ctx.strokeRect(tagX, tagY, tagW, tagH);

      ctx.fillStyle = themeColor;
      ctx.fillText(targetLabel, tagX + 8 * dpr, tagY + tagH - 5 * dpr);

      // Dimension & coordinate tag below ROI box
      const subX = Math.round(dsoRoi.centerX * imageWidth);
      const subY = Math.round(dsoRoi.centerY * imageHeight);
      const wPx = Math.round(dsoRoi.width * imageWidth);
      const hPx = Math.round(dsoRoi.height * imageHeight);
      const coordLabel = `(${subX}, ${subY}) • ${wPx}×${hPx} px`;

      const coordMetrics = ctx.measureText(coordLabel);
      const cTagW = coordMetrics.width + 12 * dpr;
      const cTagH = 17 * dpr;
      const cTagX = roiLeft + roiPxW - cTagW;
      const cTagY = Math.min(ch - cTagH - 6 * dpr, roiTop + roiPxH + 4 * dpr);

      ctx.fillStyle = '#090d16ee';
      ctx.fillRect(cTagX, cTagY, cTagW, cTagH);
      ctx.strokeStyle = '#1f2b42';
      ctx.strokeRect(cTagX, cTagY, cTagW, cTagH);

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(coordLabel, cTagX + 6 * dpr, cTagY + cTagH - 4 * dpr);
    }

    // 6. Dwarf 3 AI Tracking Reticle & Telemetry Overlay
    if (
      trackingState &&
      trackingState.showHud &&
      trackingConfig &&
      trackingState.activeMode !== 'astro' &&
      !compareRaw
    ) {
      const modeColor = trackingConfig.color || '#38bdf8';
      const tLeft = drawX + (trackingState.boxX - trackingState.boxW * 0.5) * drawW;
      const tTop = drawY + (trackingState.boxY - trackingState.boxH * 0.5) * drawH;
      const tW = trackingState.boxW * drawW;
      const tH = trackingState.boxH * drawH;
      const tCenterX = drawX + trackingState.boxX * drawW;
      const tCenterY = drawY + trackingState.boxY * drawH;

      ctx.save();
      // Thin tracking outline
      ctx.strokeStyle = `${modeColor}55`;
      ctx.lineWidth = 1 * dpr;
      ctx.strokeRect(tLeft, tTop, tW, tH);

      // Distinctive high-tech corner brackets
      ctx.strokeStyle = modeColor;
      ctx.lineWidth = 2.5 * dpr;
      const cLen = Math.min(20 * dpr, Math.min(tW, tH) * 0.25);

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(tLeft, tTop + cLen);
      ctx.lineTo(tLeft, tTop);
      ctx.lineTo(tLeft + cLen, tTop);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(tLeft + tW - cLen, tTop);
      ctx.lineTo(tLeft + tW, tTop);
      ctx.lineTo(tLeft + tW, tTop + cLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(tLeft, tTop + tH - cLen);
      ctx.lineTo(tLeft, tTop + tH);
      ctx.lineTo(tLeft + cLen, tTop + tH);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(tLeft + tW - cLen, tTop + tH);
      ctx.lineTo(tLeft + tW, tTop + tH);
      ctx.lineTo(tLeft + tW, tTop + tH - cLen);
      ctx.stroke();

      // Center reticle
      ctx.lineWidth = 1.5 * dpr;
      const chR = 7 * dpr;
      ctx.beginPath();
      ctx.moveTo(tCenterX - chR * 1.5, tCenterY);
      ctx.lineTo(tCenterX + chR * 1.5, tCenterY);
      ctx.moveTo(tCenterX, tCenterY - chR * 1.5);
      ctx.lineTo(tCenterX, tCenterY + chR * 1.5);
      ctx.stroke();

      // Predictive lead velocity vector
      if (trackingState.showLeadVector) {
        const leadScale = 320 * (trackingState.leadFactor / 100) * zoom * dpr;
        const targetLeadX = tCenterX + trackingState.velocityX * leadScale;
        const targetLeadY = tCenterY + trackingState.velocityY * leadScale;

        // Trajectory dashed line
        ctx.strokeStyle = '#38bdf8ee';
        ctx.lineWidth = 2 * dpr;
        ctx.setLineDash([4 * dpr, 3 * dpr]);
        ctx.beginPath();
        ctx.moveTo(tCenterX, tCenterY);
        ctx.lineTo(targetLeadX, targetLeadY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow head
        const angle = Math.atan2(targetLeadY - tCenterY, targetLeadX - tCenterX);
        const arrowLen = 9 * dpr;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(targetLeadX, targetLeadY);
        ctx.lineTo(
          targetLeadX - arrowLen * Math.cos(angle - Math.PI / 6),
          targetLeadY - arrowLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          targetLeadX - arrowLen * Math.cos(angle + Math.PI / 6),
          targetLeadY - arrowLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Lead vector label
        const leadTag = `LEAD [t+${Math.round(trackingState.leadFactor * 4)}ms]`;
        ctx.font = `bold ${Math.max(9, Math.floor(9.5 * dpr))}px "JetBrains Mono", monospace`;
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(leadTag, targetLeadX + 6 * dpr, targetLeadY - 4 * dpr);
      }

      // Tracking Header Tag
      const statusText = trackingState.isLocked
        ? `[LOCKED ${trackingConfig.trackingConfidence}%] ${trackingConfig.badge.toUpperCase()}`
        : `[ACQUIRING] ${trackingConfig.badge.toUpperCase()}`;
      const fSize = Math.max(10, Math.floor(10.5 * dpr));
      ctx.font = `bold ${fSize}px "JetBrains Mono", monospace`;
      const sMetrics = ctx.measureText(statusText);
      const tagW = sMetrics.width + 16 * dpr;
      const tagH = 20 * dpr;
      const tagX = tLeft;
      const tagY = Math.max(6 * dpr, tTop - tagH - 4 * dpr);

      ctx.fillStyle = '#090d16f0';
      ctx.fillRect(tagX, tagY, tagW, tagH);
      ctx.strokeStyle = modeColor;
      ctx.lineWidth = 1 * dpr;
      ctx.strokeRect(tagX, tagY, tagW, tagH);

      ctx.fillStyle = modeColor;
      ctx.fillText(statusText, tagX + 8 * dpr, tagY + tagH - 5.5 * dpr);

      // Sub-Tag (Velocity & Distance)
      const subTag = `VEL: ${trackingConfig.velocityKmh} km/h • DIST: ${trackingConfig.distanceMeters} • ${trackingConfig.shutter}`;
      const subMetrics = ctx.measureText(subTag);
      const subW = subMetrics.width + 12 * dpr;
      const subH = 17 * dpr;
      const subX = tLeft + tW - subW;
      const subY = Math.min(ch - subH - 6 * dpr, tTop + tH + 4 * dpr);

      ctx.fillStyle = '#090d16f0';
      ctx.fillRect(subX, subY, subW, subH);
      ctx.strokeStyle = '#1f2b42';
      ctx.strokeRect(subX, subY, subW, subH);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(subTag, subX + 6 * dpr, subY + subH - 4 * dpr);

      ctx.restore();
    }

    ctx.restore();
  }, [
    offscreenCanvas,
    rawOffscreenCanvas,
    compareRaw,
    splitView,
    splitDivider,
    params,
    zoom,
    panX,
    panY,
    imageWidth,
    imageHeight,
    dsoRoi,
    trackingState,
    trackingConfig,
  ]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => drawCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawCanvas]);

  // Keyboard Spacebar for Raw Compare
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        onCompareRawStart();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        onCompareRawEnd();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onCompareRawStart, onCompareRawEnd]);

  // Pointer / Mouse events for Pan, Zoom, and Pixel Inspector
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((prev) => {
      const next = Math.max(0.1, Math.min(10.0, prev * factor));
      return Number(next.toFixed(3));
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const cx = rect.width * 0.5 + panX;
    const cy = rect.height * 0.5 + panY;
    const drawW = imageWidth * zoom;
    const drawH = imageHeight * zoom;
    const drawX = cx - drawW * 0.5;
    const drawY = cy - drawH * 0.5;

    // Check if clicking to set mask center
    if (pickingMask) {
      const normX = Math.max(0, Math.min(1, (clientX - drawX) / drawW));
      const normY = Math.max(0, Math.min(1, (clientY - drawY) / drawH));
      onSetMaskCenter(normX, normY);
      return;
    }

    // Check if sampling background
    if (pickingBackground) {
      const normX = Math.max(0, Math.min(1, (clientX - drawX) / drawW));
      const normY = Math.max(0, Math.min(1, (clientY - drawY) / drawH));
      onSampleBackground(normX, normY);
      return;
    }

    // Check if clicking near split divider
    if (splitView) {
      const splitX = drawX + drawW * splitDivider;
      if (Math.abs(clientX - splitX) < 18) {
        setIsDraggingSplit(true);
        return;
      }
    }

    // Check if clicking near ROI center to drag ROI
    if (dsoRoi?.enabled && onUpdateRoi && !compareRaw) {
      const roiCenterScreenX = drawX + dsoRoi.centerX * drawW;
      const roiCenterScreenY = drawY + dsoRoi.centerY * drawH;
      const distToRoiCenter = Math.hypot(clientX - roiCenterScreenX, clientY - roiCenterScreenY);
      if (distToRoiCenter < 24 || (e.shiftKey && clientX >= drawX && clientX <= drawX + drawW && clientY >= drawY && clientY <= drawY + drawH)) {
        setIsDraggingRoi(true);
        const normX = Math.max(0.05, Math.min(0.95, (clientX - drawX) / drawW));
        const normY = Math.max(0.05, Math.min(0.95, (clientY - drawY) / drawH));
        onUpdateRoi({ centerX: Number(normX.toFixed(4)), centerY: Number(normY.toFixed(4)) });
        return;
      }
    }

    // Normal pan drag
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX,
      panY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const cx = rect.width * 0.5 + panX;
    const cy = rect.height * 0.5 + panY;
    const drawW = imageWidth * zoom;
    const drawH = imageHeight * zoom;
    const drawX = cx - drawW * 0.5;
    const drawY = cy - drawH * 0.5;

    // Split dragging
    if (isDraggingSplit) {
      const normSplit = (clientX - drawX) / drawW;
      setSplitDivider(Math.max(0.05, Math.min(0.95, normSplit)));
      return;
    }

    // ROI dragging
    if (isDraggingRoi && dsoRoi?.enabled && onUpdateRoi) {
      const normX = Math.max(0.05, Math.min(0.95, (clientX - drawX) / drawW));
      const normY = Math.max(0.05, Math.min(0.95, (clientY - drawY) / drawH));
      onUpdateRoi({ centerX: Number(normX.toFixed(4)), centerY: Number(normY.toFixed(4)) });
      return;
    }

    // Pan dragging
    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPanX(dragStartRef.current.panX + dx);
      setPanY(dragStartRef.current.panY + dy);
    }

    // Pixel Inspector Readout
    if (clientX >= drawX && clientX <= drawX + drawW && clientY >= drawY && clientY <= drawY + drawH) {
      const imgX = Math.floor(((clientX - drawX) / drawW) * imageWidth);
      const imgY = Math.floor(((clientY - drawY) / drawH) * imageHeight);

      const offCtx = offscreenCanvas.getContext('2d');
      if (offCtx && imgX >= 0 && imgX < imageWidth && imgY >= 0 && imgY < imageHeight) {
        const pix = offCtx.getImageData(imgX, imgY, 1, 1).data;
        const lum = Math.round(0.2126 * pix[0] + 0.7152 * pix[1] + 0.0722 * pix[2]);
        setHoverPixel({
          x: imgX,
          y: imgY,
          r: pix[0],
          g: pix[1],
          b: pix[2],
          lum,
        });
      }
    } else {
      setHoverPixel(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingSplit(false);
    setIsDraggingRoi(false);
  };

  return (
    <main
      ref={containerRef}
      className={`relative flex-1 min-h-[35dvh] lg:min-h-0 viewport-pattern overflow-hidden flex items-center justify-center select-none touch-none ${
        pickingMask || pickingBackground ? 'cursor-crosshair-pick' : ''
      }`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        className={`block ${
          pickingMask || pickingBackground
            ? 'cursor-crosshair'
            : isDragging
            ? 'cursor-grabbing'
            : 'cursor-grab'
        }`}
      />

      {/* Floating ROI Status Pill */}
      {dsoRoi?.enabled && !pickingMask && !pickingBackground && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-[#090d16]/95 backdrop-blur-md border border-indigo-500/50 text-xs shadow-2xl flex items-center gap-2 z-20">
          <span className="text-base">
            {dsoRoi.targetType === 'galaxy' ? '🌌' : dsoRoi.targetType === 'nebula' ? '☁️' : dsoRoi.targetType === 'cluster' ? '⭐' : '🪐'}
          </span>
          <span className="font-semibold text-white">
            {dsoRoi.targetType === 'galaxy'
              ? 'Galaxy Core ROI'
              : dsoRoi.targetType === 'nebula'
              ? 'Nebulosity Envelope'
              : dsoRoi.targetType === 'cluster'
              ? 'Cluster Core'
              : 'Planet Disc'}
          </span>
          <span className="font-mono text-indigo-300 font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-[10px]">
            {dsoRoi.zoomLevel}×
          </span>
          <button
            onClick={centerOnRoi}
            className="px-2 py-0.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-[10px] font-mono text-sky-300 flex items-center gap-1 transition active:scale-95"
            title="Snap Viewport to Center on ROI Box"
          >
            <Crosshair className="w-3 h-3 text-sky-400" />
            <span>Center</span>
          </button>
        </div>
      )}

      {/* Target Mask / Eyedropper Banner */}
      {(pickingMask || pickingBackground) && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-sky-950/90 border border-sky-400 text-sky-200 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce z-20">
          <Crosshair className="w-4 h-4 text-sky-400 animate-spin" />
          <span>
            {pickingMask
              ? 'Click anywhere on the image to set Target Mask center'
              : 'Click on a dark sky area to sample and neutralize background'}
          </span>
        </div>
      )}

      {/* Split-screen Mode Labels */}
      {splitView && (
        <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none z-10 text-[11px] font-mono font-semibold">
          <span className="px-2.5 py-1 rounded-md bg-amber-950/80 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
            ◄ Original (Linear)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-sky-950/80 text-sky-300 border border-sky-500/40 backdrop-blur-sm">
            Stretched (Enhanced) ►
          </span>
        </div>
      )}

      {/* Dwarf 3 AI Tracking Telemetry Card */}
      {trackingState && trackingState.activeMode !== 'astro' && trackingConfig && (
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#090d16]/95 backdrop-blur-md border border-[#1f2b42] shadow-2xl z-20 text-[11px] font-mono">
          <div className="flex items-center justify-between gap-3 border-b border-[#1f2b42]/70 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-white tracking-wider text-[10px]">
                DWARF 3 NPU TRACKER
              </span>
            </div>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${trackingConfig.bgColor} ${trackingConfig.borderColor} border text-white`}>
              {trackingConfig.badge}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-300">
            <div>
              <span className="text-slate-500">Lens: </span>
              <span className="text-sky-300 font-semibold">{trackingState.activeLens === 'tele' ? '150mm Tele (f/4.3)' : '24mm Wide (f/2.8)'}</span>
            </div>
            <div>
              <span className="text-slate-500">Lock: </span>
              <span className={trackingState.isLocked ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                {trackingState.isLocked ? `LOCKED (${trackingConfig.trackingConfidence}%)` : 'SEARCHING'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Speed: </span>
              <span className="text-slate-100">{trackingConfig.velocityKmh} km/h</span>
            </div>
            <div>
              <span className="text-slate-500">Range: </span>
              <span className="text-slate-100">{trackingConfig.distanceMeters}</span>
            </div>
            <div>
              <span className="text-slate-500">PID: </span>
              <span className="text-slate-200">{trackingState.pidGain}%</span>
            </div>
            <div>
              <span className="text-slate-500">Lead: </span>
              <span className="text-purple-300">{trackingState.leadFactor}%</span>
            </div>
          </div>

          {/* Quick HUD controls */}
          <div className="flex items-center gap-1 pt-1 border-t border-[#1f2b42]/70">
            <button
              onClick={() => onUpdateTrackingState?.({ showHud: !trackingState.showHud })}
              className={`px-2 py-0.5 rounded text-[10px] border transition ${
                trackingState.showHud ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-[#131b2b] text-slate-400 border-[#1f2b42]'
              }`}
            >
              HUD {trackingState.showHud ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => onUpdateTrackingState?.({ showLeadVector: !trackingState.showLeadVector })}
              className={`px-2 py-0.5 rounded text-[10px] border transition ${
                trackingState.showLeadVector ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-[#131b2b] text-slate-400 border-[#1f2b42]'
              }`}
            >
              Vector {trackingState.showLeadVector ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => onUpdateTrackingState?.({ activeLens: trackingState.activeLens === 'tele' ? 'wide' : 'tele' })}
              className="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition"
              title="Toggle between Telephoto 150mm and Wide 24mm lenses"
            >
              Switch Lens
            </button>
          </div>
        </div>
      )}

      {/* Pixel Inspector HUD */}
      {hoverPixel && (!trackingState || trackingState.activeMode === 'astro') && (
        <div className="absolute top-3 left-3 hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#0d121d]/90 border border-[#1f2b42] text-[11px] font-mono text-slate-300 backdrop-blur-md shadow-xl pointer-events-none z-10">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>
            X:<strong className="text-white">{hoverPixel.x}</strong> Y:<strong className="text-white">{hoverPixel.y}</strong>
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-red-400">R: {hoverPixel.r}</span>
          <span className="text-green-400">G: {hoverPixel.g}</span>
          <span className="text-blue-400">B: {hoverPixel.b}</span>
          <span className="text-slate-400">Lum: {hoverPixel.lum}</span>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#090d16]/90 backdrop-blur-md border border-[#1f2b42] shadow-2xl z-20">
        <button
          onClick={() => setZoom((prev) => Math.max(0.1, Number((prev * 0.8).toFixed(2))))}
          className="p-1.5 rounded-lg hover:bg-[#1a2337] text-slate-300 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-[11px] font-mono text-sky-300 min-w-[50px] text-center font-medium">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom((prev) => Math.min(10.0, Number((prev * 1.25).toFixed(2))))}
          className="p-1.5 rounded-lg hover:bg-[#1a2337] text-slate-300 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-[#1f2b42] mx-1"></div>

        <button
          onClick={fitToScreen}
          className="px-2 py-1 rounded-lg hover:bg-[#1a2337] text-[11px] font-medium text-slate-300 transition flex items-center gap-1"
          title="Fit Image to Viewport"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Fit</span>
        </button>

        <button
          onClick={() => {
            setZoom(1.0);
            setPanX(0);
            setPanY(0);
          }}
          className="px-2 py-1 rounded-lg hover:bg-[#1a2337] text-[11px] font-mono text-slate-300 transition"
          title="Actual Size 1:1 Pixels"
        >
          1:1
        </button>

        {dsoRoi?.enabled && (
          <>
            <div className="h-4 w-px bg-[#1f2b42] mx-1"></div>
            <button
              onClick={centerOnRoi}
              className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-[11px] font-semibold text-indigo-300 transition flex items-center gap-1"
              title="Center Viewport on ROI Box"
            >
              <Crosshair className="w-3 h-3 text-indigo-400" />
              <span>ROI {dsoRoi.zoomLevel}×</span>
            </button>
          </>
        )}

        <div className="h-4 w-px bg-[#1f2b42] mx-1"></div>

        {/* Hold to Compare Raw Linear */}
        <button
          onMouseDown={onCompareRawStart}
          onMouseUp={onCompareRawEnd}
          onMouseLeave={onCompareRawEnd}
          onTouchStart={(e) => {
            e.preventDefault();
            onCompareRawStart();
          }}
          onTouchEnd={onCompareRawEnd}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 select-none ${
            compareRaw
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
          }`}
          title="Hold down (or hold Spacebar) to compare with unedited raw sensor data"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Raw/Hold</span>
        </button>
      </div>
    </main>
  );
};
