export async function savePngFile(getPng: () => Promise<string | undefined>, filename = 'figure.png') {
  const png = await getPng();
  if (png) {
    const link = document.createElement('a');
    link.href = png;
    link.download = filename;
    link.click();
  }
}
