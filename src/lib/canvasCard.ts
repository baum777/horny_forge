// Canvas-based share card generation

interface CardStyle {
  background: string;
  textColor: string;
  accentColor: string;
  gradientStart: string;
  gradientEnd: string;
}

const DEFAULT_STYLE: CardStyle = {
  background: '#000000',
  textColor: '#FFFFFF',
  accentColor: '#FF69B4',
  gradientStart: '#FF69B4',
  gradientEnd: '#FF0000',
};

// Create a canvas context with proper sizing
function createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

// Draw gradient background
function drawGradientBackground(ctx: CanvasRenderingContext2D, width: number, height: number, style: CardStyle) {
  // Dark background
  ctx.fillStyle = style.background;
  ctx.fillRect(0, 0, width, height);
  
  // Gradient overlay
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `${style.gradientStart}20`);
  gradient.addColorStop(1, `${style.gradientEnd}20`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Border glow
  ctx.strokeStyle = style.accentColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);
}

// Draw text with shadow
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  align: CanvasTextAlign = 'center',
  maxWidth?: number
) {
  ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  
  if (maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
  
  ctx.shadowBlur = 0;
}

// Generate Badge Card
export async function generateBadgeCard(
  badgeName: string,
  rarity: string,
  description: string,
  footerLabel: string
): Promise<string> {
  const width = 500;
  const height = 350;
  const { canvas, ctx } = createCanvas(width, height);
  
  const rarityColors: Record<string, string> = {
    Common: '#AAAAAA',
    Rare: '#3498DB',
    Epic: '#9B59B6',
  };
  
  const accentColor = rarityColors[rarity] || DEFAULT_STYLE.accentColor;
  
  drawGradientBackground(ctx, width, height, { ...DEFAULT_STYLE, accentColor });
  
  // Badge icon (simple circle with glow)
  ctx.beginPath();
  ctx.arc(width / 2, 100, 50, 0, Math.PI * 2);
  ctx.fillStyle = accentColor;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 30;
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Trophy emoji
  ctx.font = '48px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏆', width / 2, 115);
  
  // Badge name
  drawText(ctx, badgeName, width / 2, 190, 28, DEFAULT_STYLE.textColor);
  
  // Rarity
  drawText(ctx, rarity.toUpperCase(), width / 2, 230, 20, accentColor);
  
  // Description
  ctx.font = 'normal 16px "Inter", sans-serif';
  ctx.fillStyle = '#CCCCCC';
  ctx.fillText(description, width / 2, 280, width - 60);
  
  // Footer
  drawText(ctx, footerLabel, width / 2, height - 30, 14, '#888888');
  
  return canvas.toDataURL('image/png');
}

// Generate Content Card
export async function generateContentCard(
  templateId: string,
  topText: string,
  bottomText: string,
  accentStyle: 'pink' | 'red' | 'gold'
): Promise<string> {
  const width = 600;
  const height = 600;
  const { canvas, ctx } = createCanvas(width, height);
  
  const styleColors = {
    pink: { start: '#FF69B4', end: '#FF1493' },
    red: { start: '#FF0000', end: '#8B0000' },
    gold: { start: '#FFD700', end: '#FFA500' },
  };
  
  const colors = styleColors[accentStyle];
  
  // Background based on template
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
  gradient.addColorStop(0, colors.start + '40');
  gradient.addColorStop(1, '#000000');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Template-specific elements
  drawTemplateElements(ctx, templateId, width, height, colors.start);
  
  // Top text
  if (topText) {
    ctx.font = 'bold 48px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(topText.toUpperCase(), width / 2, 80, width - 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(topText.toUpperCase(), width / 2, 80, width - 40);
  }
  
  // Bottom text
  if (bottomText) {
    ctx.font = 'bold 48px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(bottomText.toUpperCase(), width / 2, height - 40, width - 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(bottomText.toUpperCase(), width / 2, height - 40, width - 40);
  }
  
  // Border
  ctx.strokeStyle = colors.start;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, width - 6, height - 6);
  
  return canvas.toDataURL('image/png');
}

function drawTemplateElements(
  ctx: CanvasRenderingContext2D,
  templateId: string,
  width: number,
  height: number,
  accentColor: string
) {
  ctx.fillStyle = accentColor;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  
  switch (templateId) {
    case 'unicorn':
      // Unicorn horn
      ctx.beginPath();
      ctx.moveTo(width / 2, 150);
      ctx.lineTo(width / 2 - 40, 300);
      ctx.lineTo(width / 2 + 40, 300);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'chart':
      // Ascending chart lines
      ctx.beginPath();
      ctx.moveTo(100, 450);
      ctx.lineTo(200, 380);
      ctx.lineTo(300, 400);
      ctx.lineTo(400, 250);
      ctx.lineTo(500, 180);
      ctx.stroke();
      break;
      
    case 'ai-brain':
      // Brain/AI circuit pattern
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 100, 0, Math.PI * 2);
      ctx.stroke();
      // Inner patterns
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, height / 2);
        ctx.lineTo(
          width / 2 + Math.cos(angle) * 100,
          height / 2 + Math.sin(angle) * 100
        );
        ctx.stroke();
      }
      break;
      
    case 'rocket':
      // Rocket shape
      ctx.beginPath();
      ctx.moveTo(width / 2, 180);
      ctx.lineTo(width / 2 + 50, 350);
      ctx.lineTo(width / 2 - 50, 350);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'moon':
      // Moon crescent
      ctx.beginPath();
      ctx.arc(width / 2, height / 2 - 50, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(width / 2 + 30, height / 2 - 50, 70, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'diamond':
    default:
      // Diamond hands
      ctx.beginPath();
      ctx.moveTo(width / 2, 180);
      ctx.lineTo(width / 2 + 80, height / 2);
      ctx.lineTo(width / 2, height / 2 + 100);
      ctx.lineTo(width / 2 - 80, height / 2);
      ctx.closePath();
      ctx.fill();
      break;
  }
}

// Download image helper
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
