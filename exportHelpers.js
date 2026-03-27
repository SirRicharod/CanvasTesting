/**
 * Helper utilities for exporting a Fabric.js canvas to various image formats.
 * All functions return a string that can be used as the href of a download link.
 */

/**
 * Export the canvas as a PNG data‑URL.
 * @param {fabric.Canvas} canvas - The Fabric canvas instance.
 * @param {number} [multiplier=2] - Scale factor for higher‑resolution output.
 * @returns {string} Data‑URL containing the PNG image.
 */
export function exportCanvasAsPNG(canvas, multiplier = 2) {
    // Fabric's toDataURL respects the multiplier for DPI scaling.
    return canvas.toDataURL({ format: "png", multiplier });
}

/**
 * Export the canvas as a JPEG data‑URL.
 * @param {fabric.Canvas} canvas - The Fabric canvas instance.
 * @param {number} [multiplier=2] - Scale factor for higher‑resolution output.
 * @param {number} [quality=0.9] - JPEG quality between 0 and 1.
 * @returns {string} Data‑URL containing the JPEG image.
 */
export function exportCanvasAsJPEG(canvas, multiplier = 2, quality = 0.9) {
    return canvas.toDataURL({ format: "jpeg", multiplier, quality });
}

/**
 * Export the canvas as an SVG string.
 * @param {fabric.Canvas} canvas - The Fabric canvas instance.
 * @returns {string} SVG markup representing the canvas content.
 */
export function exportCanvasAsSVG(canvas) {
    return canvas.toSVG();
}

/**
 * Trigger a download of the provided content.
 * For PNG/JPEG the content is a data‑URL. For SVG we create a Blob.
 * @param {string} content - Data‑URL (PNG/JPEG) or raw SVG markup.
 * @param {string} filename - Desired filename for the download.
 */
export function triggerDownload(content, filename) {
    const link = document.createElement("a");
    if (content.startsWith("data:")) {
        // PNG or JPEG – data URL can be used directly.
        link.href = content;
    } else {
        // Assume raw SVG markup – create a Blob and object URL.
        const blob = new Blob([content], { type: "image/svg+xml;charset=utf-8" });
        link.href = URL.createObjectURL(blob);
    }
    link.download = filename;
    link.click();
    // Clean up object URL for SVG case.
    if (!content.startsWith("data:")) {
        URL.revokeObjectURL(link.href);
    }
}
