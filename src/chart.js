export function drawChart(ctx, canvas, accData) {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  // axes
  ctx.strokeStyle = '#e6e8ef';
  ctx.beginPath();
  ctx.moveTo(30, H / 2);
  ctx.lineTo(W - 5, H / 2); // zero line
  ctx.moveTo(30, 5);
  ctx.lineTo(30, H - 5);
  ctx.stroke();

  // labels
  ctx.fillStyle = '#616161';
  ctx.font = '12px system-ui';
  ctx.fillText('+ms', 5, 14);
  ctx.fillText('-ms', 5, H - 6);

  // data
  if (accData.length === 0) return;
  const maxAbs = Math.max(60, ...accData.map(v => Math.abs(v)));
  const scaleY = (H / 2 - 10) / maxAbs;
  const left = 36;
  const right = W - 8;
  const span = right - left;
  const step = accData.length > 1 ? (span / (accData.length - 1)) : 0;

  // zero line already drawn; draw points and a simple polyline
  ctx.strokeStyle = '#6b6ff7';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  accData.forEach((v, i) => {
    const x = left + i * step;
    const y = H / 2 - v * scaleY;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = '#111';
  accData.forEach((v, i) => {
    const x = left + i * step;
    const y = H / 2 - v * scaleY;
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
}
