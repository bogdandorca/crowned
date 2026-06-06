// Crowned - share image export and clipboard helpers

function escapeSvgText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shareCardSvg({ donor, orgName, format }) {
  const width = format === 'story' ? 360 : 400;
  const height = format === 'story' ? 640 : 400;
  const name = escapeSvgText(fullName(donor));
  const org = escapeSvgText(orgName);
  const amount = escapeSvgText(fmtMoney(donor.amount));
  const initialsText = escapeSvgText(initials(donor));
  const heroY = format === 'story' ? 265 : 170;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#fbf7f0"/>
      <stop offset="0.55" stop-color="#f1e8dc"/>
      <stop offset="1" stop-color="#e8edf0"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="${width * 0.18}" cy="0" r="${width * 0.58}" fill="#ead8df" opacity="0.58"/>
  <circle cx="${width * 0.9}" cy="42" r="${width * 0.48}" fill="#e6edf0" opacity="0.82"/>
  <circle cx="${width / 2}" cy="${heroY - 70}" r="66" fill="#fffaf1" stroke="#c9b37d" stroke-width="4"/>
  <text x="${width / 2}" y="${heroY - 48}" text-anchor="middle" font-family="Georgia, serif" font-size="38" font-weight="700" fill="#4a3b27">${initialsText}</text>
  <text x="${width / 2}" y="64" text-anchor="middle" font-family="Georgia, serif" font-size="24" font-weight="700" fill="#302b26">${org}</text>
  <text x="${width / 2}" y="${heroY + 38}" text-anchor="middle" font-family="Georgia, serif" font-size="${format === 'story' ? 30 : 26}" font-weight="700" fill="#302b26">${name}</text>
  <text x="${width / 2}" y="${heroY + 88}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${format === 'story' ? 44 : 38}" font-weight="800" fill="#7c5f30">${amount}</text>
  <text x="${width / 2}" y="${height - 84}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#4d453d">#${donor.rank} on the ${org} leaderboard</text>
  <text x="${width / 2}" y="${height - 52}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="700" letter-spacing="2" fill="#6f655b">EVERY GIFT WRITES THE LEGACY</text>
</svg>`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadShareImage({ donor, orgName, format }) {
  const svg = shareCardSvg({ donor, orgName, format });
  const width = format === 'story' ? 360 : 400;
  const height = format === 'story' ? 640 : 400;
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          reject(new Error('Could not export share image'));
          return;
        }
        downloadBlob(pngBlob, `crowned-${donor.rank}-${format}.png`);
        resolve();
      }, 'image/png');
    };
    image.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Could not render share image'));
    };
    image.src = svgUrl;
  });
}

async function copyShareLink(url) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }
  const input = document.createElement('textarea');
  input.value = url;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

Object.assign(window, {
  shareCardSvg,
  downloadShareImage,
  copyShareLink,
});
