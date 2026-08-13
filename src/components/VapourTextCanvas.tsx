import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

export interface VapourTextCanvasHandle {
  setProgress: (progress: number) => void;
}

interface Particle {
  x: number;
  y: number;
  alpha: number;
  color: string;
  driftX: number;
  driftY: number;
  threshold: number;
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const easeOutQuint = (value: number) => 1 - Math.pow(1 - value, 5);

const createRandom = (seed: number) => () => {
  let value = (seed += 0x6d2b79f5);
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};

const VapourTextCanvas = forwardRef<VapourTextCanvasHandle>(function VapourTextCanvas(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const progressRef = useRef(0);
  const dprRef = useRef(1);

  const render = (progress: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const dpr = dprRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.scale(dpr, dpr);

    particlesRef.current.forEach((particle) => {
      const localProgress = clamp((progress - particle.threshold) / 0.24);
      const eased = easeOutQuint(localProgress);
      const alpha = particle.alpha * (1 - localProgress);

      if (alpha <= 0.01) return;

      context.fillStyle = `rgba(${particle.color}, ${alpha})`;
      context.fillRect(
        particle.x + particle.driftX * eased,
        particle.y + particle.driftY * eased,
        1.35,
        1.35,
      );
    });

    context.restore();
  };

  const buildParticles = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    await document.fonts.ready;

    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    dprRef.current = dpr;
    canvas.width = Math.round(bounds.width * dpr);
    canvas.height = Math.round(bounds.height * dpr);

    const fontSize = Math.min(70, bounds.width / 8.6);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = `400 ${fontSize * dpr}px "Neue Montreal", "Helvetica Neue", sans-serif`;
    context.textBaseline = 'alphabetic';
    context.textAlign = 'left';

    if ('letterSpacing' in context) {
      (context as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${
        -2.1 * dpr
      }px`;
    }

    const muted = 'rgba(0, 10, 60, 0.42)';
    const navy = 'rgb(0, 10, 60)';
    const firstBaseline = 70 * dpr;
    const secondBaseline = 148 * dpr;

    context.fillStyle = muted;
    context.fillText('Moving shouldn’t', 0, firstBaseline);
    context.fillText('feel like ', 0, secondBaseline);
    const prefixWidth = context.measureText('feel like ').width;
    context.fillStyle = navy;
    context.fillText('a Gamble', prefixWidth, secondBaseline);

    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const random = createRandom(245372);
    const particles: Particle[] = [];
    const sampleStep = Math.max(2, Math.round(dpr * 2));

    for (let y = 0; y < canvas.height; y += sampleStep) {
      for (let x = 0; x < canvas.width; x += sampleStep) {
        const index = (y * canvas.width + x) * 4;
        const alpha = image.data[index + 3];
        if (alpha < 28) continue;

        const logicalX = x / dpr;
        const logicalY = y / dpr;
        const horizontalProgress = clamp(logicalX / Math.max(1, bounds.width));

        particles.push({
          x: logicalX,
          y: logicalY,
          alpha: alpha / 255,
          color: `${image.data[index]}, ${image.data[index + 1]}, ${image.data[index + 2]}`,
          driftX: 24 + random() * 82,
          driftY: -20 - random() * 86 + (random() - 0.5) * 28,
          threshold: clamp(horizontalProgress * 0.74 + random() * 0.08, 0, 0.8),
        });
      }
    }

    particlesRef.current = particles;
    render(progressRef.current);
  };

  useImperativeHandle(ref, () => ({
    setProgress(progress: number) {
      progressRef.current = clamp(progress);
      render(progressRef.current);
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      void buildParticles();
    });

    resizeObserver.observe(canvas);
    void buildParticles();

    return () => resizeObserver.disconnect();
  }, []);

  return <canvas ref={canvasRef} className="story__vapour-canvas" aria-hidden="true" />;
});

export default VapourTextCanvas;