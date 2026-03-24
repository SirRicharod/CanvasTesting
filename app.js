// ============================================================================
// SECTION 1: CANVAS INITIALIZATION & SETUP
// ============================================================================

let canvasObj = new fabric.Canvas('mainCanvasId');
const printArea = document.querySelector(".print-area");
const canvasOverlayToggle = document.getElementById("toggle-canvas-overlay");
const canvasOverlayToggleIcon = document.getElementById("toggle-canvas-overlay-icon");

// Synchronize canvas dimensions with print area on load and window resize
function syncCanvasToPrintArea() {
    if (!printArea) return;

    const width = Math.round(printArea.clientWidth);
    const height = Math.round(printArea.clientHeight);

    if (!width || !height) return;

    if (canvasObj.getWidth() !== width || canvasObj.getHeight() !== height) {
        canvasObj.setDimensions({ width, height });
        canvasObj.requestRenderAll();
    }
}

syncCanvasToPrintArea();
window.addEventListener("resize", syncCanvasToPrintArea);

// Toggle between design view and clean product preview
function setCleanPreview(enabled) {
    if (!printArea || !canvasOverlayToggle || !canvasOverlayToggleIcon) return;

    printArea.classList.toggle("clean-preview", enabled);
    canvasOverlayToggleIcon.classList.toggle("bi-eye", !enabled);
    canvasOverlayToggleIcon.classList.toggle("bi-eye-slash", enabled);
    canvasOverlayToggle.title = enabled
        ? "Show canvas frame"
        : "Preview shirt without canvas frame";
}

if (canvasOverlayToggle) {
    let isCleanPreview = false;
    canvasOverlayToggle.addEventListener("click", function () {
        isCleanPreview = !isCleanPreview;
        setCleanPreview(isCleanPreview);
    });
}

// Double-click on object brings it to front
canvasObj.on('mouse:dblclick', function (options) {
    if (options.target) {
        canvasObj.bringObjectToFront(options.target);
        canvasObj.renderAll();
        DisplayList();
    }
});

// ============================================================================
// SECTION 2: PROPERTY INSPECTOR & OBJECT SELECTION
// ============================================================================

const displayList = document.getElementById("list");
const selectedType = document.getElementById("selected-type");
const textControlsGroup = document.getElementById("text-controls-group");
const deleteSelectedButton = document.getElementById("delete-selected");

// Inspector field references for easy access and updates
const inspectorFields = {
    left: document.getElementById("prop-left"),
    top: document.getElementById("prop-top"),
    width: document.getElementById("prop-width"),
    height: document.getElementById("prop-height"),
    radius: document.getElementById("prop-radius"),
    strokeWidth: document.getElementById("prop-stroke-width"),
    angle: document.getElementById("prop-angle"),
    fill: document.getElementById("prop-fill"),
    stroke: document.getElementById("prop-stroke"),
    text: document.getElementById("prop-text"),
    fontSize: document.getElementById("prop-font-size"),
    fontFamily: document.getElementById("prop-font-family")
};

// Flag to prevent inspector from triggering updates while syncing
let isUpdatingInspector = false;

// Convert any color format to hex string for consistent display
function colorToHex(colorValue) {
    if (!colorValue || colorValue === "transparent") {
        return "#000000";
    }

    try {
        return `#${new fabric.Color(colorValue).toHex()}`;
    } catch {
        return "#000000";
    }
}

// Enable or disable all inspector input fields
function setInspectorEnabled(isEnabled) {
    Object.values(inspectorFields).forEach((field) => {
        field.disabled = !isEnabled;
    });
}

// Check if object is a text-based object
function isTextObject(object) {
    return ["text", "i-text", "textbox"].includes(object.type);
}

// Toggle visibility of text-specific controls
function setTextControlsVisible(isVisible) {
    textControlsGroup.style.display = isVisible ? "contents" : "none";
}

// Update inspector UI to reflect currently selected object's properties
function syncInspectorWithSelection() {
    const selectedObject = canvasObj.getActiveObject();

    // No selection or multiple objects selected - clear inspector
    if (!selectedObject || selectedObject.type === "activeSelection") {
        isUpdatingInspector = true;
        selectedType.textContent = "None";
        Object.values(inspectorFields).forEach((field) => {
            field.value = "";
        });
        setInspectorEnabled(false);
        setTextControlsVisible(false);
        deleteSelectedButton.disabled = true;
        isUpdatingInspector = false;
        return;
    }

    // Get actual scaled dimensions
    const scaledWidth = selectedObject.getScaledWidth ? selectedObject.getScaledWidth() : (selectedObject.width || 0);
    const scaledHeight = selectedObject.getScaledHeight ? selectedObject.getScaledHeight() : (selectedObject.height || 0);

    // Populate inspector fields with object's current properties
    isUpdatingInspector = true;
    selectedType.textContent = selectedObject.type;
    inspectorFields.left.value = Math.round(selectedObject.left || 0);
    inspectorFields.top.value = Math.round(selectedObject.top || 0);
    inspectorFields.width.value = Math.round(scaledWidth || 0);
    inspectorFields.height.value = Math.round(scaledHeight || 0);
    inspectorFields.radius.value = selectedObject.radius ? Math.round(selectedObject.radius) : "";
    inspectorFields.strokeWidth.value = selectedObject.strokeWidth || 0;
    inspectorFields.angle.value = Math.round(selectedObject.angle || 0);
    inspectorFields.fill.value = colorToHex(selectedObject.fill);
    inspectorFields.stroke.value = colorToHex(selectedObject.stroke);
    inspectorFields.text.value = isTextObject(selectedObject) ? (selectedObject.text || "") : "";
    inspectorFields.fontSize.value = isTextObject(selectedObject) && selectedObject.fontSize ? selectedObject.fontSize : "";
    inspectorFields.fontFamily.value = isTextObject(selectedObject) ? (selectedObject.fontFamily || "") : "";

    // Show/hide controls based on object type
    const selectedIsText = isTextObject(selectedObject);
    setInspectorEnabled(true);
    inspectorFields.radius.disabled = selectedObject.type !== "circle";
    inspectorFields.text.disabled = !selectedIsText;
    inspectorFields.fontSize.disabled = !selectedIsText;
    inspectorFields.fontFamily.disabled = !selectedIsText;
    setTextControlsVisible(selectedIsText);
    deleteSelectedButton.disabled = false;
    isUpdatingInspector = false;
}

// Apply changes from inspector fields to the selected object
function applyInspectorEdits() {
    // Prevent infinite loop when inspector is being synced
    if (isUpdatingInspector) return;

    const selectedObject = canvasObj.getActiveObject();
    if (!selectedObject || selectedObject.type === "activeSelection") return;

    // Parse numeric inputs
    const left = Number(inspectorFields.left.value);
    const top = Number(inspectorFields.top.value);
    const width = Number(inspectorFields.width.value);
    const height = Number(inspectorFields.height.value);
    const radius = Number(inspectorFields.radius.value);
    const strokeWidth = Number(inspectorFields.strokeWidth.value);
    const angle = Number(inspectorFields.angle.value);

    // Apply position
    if (!Number.isNaN(left)) selectedObject.set("left", left);
    if (!Number.isNaN(top)) selectedObject.set("top", top);

    // Apply dimensions via scaling
    if (!Number.isNaN(width) && width > 0) {
        const baseWidth = selectedObject.width || 1;
        selectedObject.set("scaleX", width / baseWidth);
    }

    if (!Number.isNaN(height) && height > 0) {
        const baseHeight = selectedObject.height || 1;
        selectedObject.set("scaleY", height / baseHeight);
    }

    // Apply radius (circles only)
    if (selectedObject.type === "circle" && !Number.isNaN(radius) && radius > 0) {
        selectedObject.set("radius", radius);
    }

    // Apply stroke properties
    if (!Number.isNaN(strokeWidth) && strokeWidth >= 0) {
        selectedObject.set("strokeWidth", strokeWidth);
    }

    // Apply rotation
    if (!Number.isNaN(angle)) {
        selectedObject.set("angle", angle);
    }

    // Apply colors
    selectedObject.set("fill", inspectorFields.fill.value || selectedObject.fill);
    selectedObject.set("stroke", inspectorFields.stroke.value || selectedObject.stroke);

    // Apply text-specific properties
    if (isTextObject(selectedObject)) {
        selectedObject.set("text", inspectorFields.text.value);

        const fontSize = Number(inspectorFields.fontSize.value);
        if (!Number.isNaN(fontSize) && fontSize > 0) {
            selectedObject.set("fontSize", fontSize);
        }

        if (inspectorFields.fontFamily.value.trim()) {
            selectedObject.set("fontFamily", inspectorFields.fontFamily.value.trim());
        }
    }

    // Update canvas rendering
    selectedObject.setCoords();
    canvasObj.requestRenderAll();
    DisplayList();
}

// Listen for changes in inspector fields
Object.values(inspectorFields).forEach((field) => {
    field.addEventListener("input", applyInspectorEdits);
    field.addEventListener("change", applyInspectorEdits);
});

// Delete button - remove selected object from canvas
deleteSelectedButton.addEventListener("click", function () {
    const selectedObject = canvasObj.getActiveObject();
    if (!selectedObject || selectedObject.type === "activeSelection") return;

    canvasObj.remove(selectedObject);
    canvasObj.discardActiveObject();
    canvasObj.requestRenderAll();
    DisplayList();
    syncInspectorWithSelection();
});

// Sync inspector whenever canvas selection changes or object is modified
canvasObj.on("selection:created", syncInspectorWithSelection);
canvasObj.on("selection:updated", syncInspectorWithSelection);
canvasObj.on("selection:cleared", syncInspectorWithSelection);
canvasObj.on("object:modified", syncInspectorWithSelection);
canvasObj.on("object:moving", syncInspectorWithSelection);
canvasObj.on("object:scaling", syncInspectorWithSelection);

// ============================================================================
// SECTION 3: LAYER MANAGEMENT
// ============================================================================

// Move object forward or backward in the layer stack
function moveObjectLayer(object, direction) {
    const objects = canvasObj.getObjects();
    const currentIndex = objects.indexOf(object);
    if (currentIndex === -1) return;

    const nextIndex = direction === "forward"
        ? Math.min(objects.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);

    if (nextIndex === currentIndex) return;

    // Use Fabric.js moveObjectTo if available, otherwise use remove/insert
    if (typeof canvasObj.moveObjectTo === "function") {
        canvasObj.moveObjectTo(object, nextIndex);
    } else {
        canvasObj.remove(object);
        canvasObj.insertAt(object, nextIndex);
    }

    canvasObj.requestRenderAll();
    DisplayList();
}

// Update layer list UI - shows all objects on canvas with controls
function DisplayList() {
    displayList.innerHTML = "";

    const currentObjects = canvasObj.getObjects();
    currentObjects.forEach((object, index) => {
        const listItem = document.createElement("div");
        listItem.className = "layer-item d-flex align-items-center gap-2 justify-content-between";

        // Layer label with index and type
        const label = document.createElement("span");
        label.textContent = `${index}: ${object.type}`;

        // Control buttons container
        const controls = document.createElement("div");
        controls.className = "d-flex align-items-center gap-1";

        // Send backward button
        const backButton = document.createElement("button");
        backButton.className = "btn btn-sm btn-outline-secondary";
        backButton.innerHTML = '<i class="bi bi-caret-down-fill"></i>';
        backButton.title = "Send backward";
        backButton.disabled = index === 0;
        backButton.addEventListener("click", function () {
            moveObjectLayer(object, "backward");
        });

        // Bring forward button
        const forwardButton = document.createElement("button");
        forwardButton.className = "btn btn-sm btn-outline-secondary";
        forwardButton.innerHTML = '<i class="bi bi-caret-up-fill"></i>';
        forwardButton.title = "Bring forward";
        forwardButton.disabled = index === currentObjects.length - 1;
        forwardButton.addEventListener("click", function () {
            moveObjectLayer(object, "forward");
        });

        // Delete object button
        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-sm btn-danger";
        deleteButton.textContent = "X";
        deleteButton.addEventListener("click", function () {
            canvasObj.remove(object);
            canvasObj.discardActiveObject();
            canvasObj.requestRenderAll();
            DisplayList();
        });

        controls.appendChild(backButton);
        controls.appendChild(forwardButton);
        controls.appendChild(deleteButton);

        listItem.appendChild(label);
        listItem.appendChild(controls);
        displayList.appendChild(listItem);
    });
}

// ============================================================================
// SECTION 4: OBJECT CREATION FUNCTIONS
// ============================================================================

const colorArray = ['white', 'gray', 'black', 'brown', 'purple', 'magenta', 'pink', 'red', 'orange', 'yellow', 'lime', 'green', 'darkgreen', 'lightblue', 'cyan', 'blue', 'darkblue'];

// Get random color from predefined array
function GetRandomColor() {
    return colorArray[Math.floor(Math.random() * colorArray.length)];
}

// Calculate center point of canvas for object placement
function GetCanvasCenter() {
    return {
        left: Math.round(canvasObj.getWidth() / 2),
        top: Math.round(canvasObj.getHeight() / 2)
    };
}

// Create and add a rectangle to canvas
function CreateSquare() {
    const center = GetCanvasCenter();
    let rectObj = new fabric.Rect({
        left: center.left, 
        top: center.top, 
        fill: GetRandomColor(), 
        stroke: GetRandomColor(), 
        width: 100, 
        height: 100
    });
    canvasObj.add(rectObj);
    DisplayList();
}

// Create and add a circle to canvas
function CreateCircle() {
    const center = GetCanvasCenter();
    let circleObj = new fabric.Circle({
        radius: 75, 
        fill: GetRandomColor(), 
        stroke: GetRandomColor(), 
        left: center.left, 
        top: center.top
    });
    canvasObj.add(circleObj);
    DisplayList();
}

// Create and add text to canvas
function CreateText() {
    let input = document.getElementById("textinput").value;
    const center = GetCanvasCenter();
    let newText = new fabric.Textbox(input, {
        top: center.top, 
        left: center.left, 
        editable: true
    });

    canvasObj.add(newText);
    DisplayList();
}

// Create and add image from file input to canvas
function CreateImage() {
    const fileInput = document.getElementById('image');
    const selectedFile = fileInput.files && fileInput.files[0];

    if (!selectedFile) {
        console.log("no file added");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const imgElement = new Image();
        imgElement.onload = function () {
            const center = GetCanvasCenter();
            const img = new fabric.Image(imgElement, {
                left: center.left,
                top: center.top
            });

            img.scaleToHeight(300);
            img.scaleToWidth(300);
            canvasObj.add(img);
            canvasObj.requestRenderAll();
            DisplayList();
        };

        imgElement.src = event.target.result;
    };

    reader.readAsDataURL(selectedFile);
}

// ============================================================================
// SECTION 5: EXPORT & IMPORT
// ============================================================================

// Export canvas objects as JSON to clipboard
function ExportJSON() {
    let jsonExport = JSON.stringify(canvasObj);
    navigator.clipboard.writeText(jsonExport);
}

// Import canvas objects from JSON textarea
function ImportJSON() {
    const json = document.getElementById("json-import");
    try {
        canvasObj.loadFromJSON(json.value, function () {
            canvasObj.requestRenderAll();
            DisplayList();
        });
    }
    catch (e) {
        alert(e);
    }
    json.value = "";
}

// ============================================================================
// SECTION 6: DRAWING MODE
// ============================================================================

canvasObj.freeDrawingBrush = new fabric.PencilBrush(canvasObj);

const colorPicker = document.getElementById("color");
colorPicker.addEventListener("input", SetBrushColor);
colorPicker.addEventListener("change", watchColorPicker);

// Watch for color picker changes
function watchColorPicker(event) {
    SetBrushColor();
}

// Set brush color from color picker
function SetBrushColor() {
    canvasObj.freeDrawingBrush.color = colorPicker.value;
}

const drawButton = document.getElementById("draw-btn");

// Toggle drawing mode on/off
function DrawingMode() {
    canvasObj.isDrawingMode = !canvasObj.isDrawingMode;
    canvasObj.freeDrawingBrush.width = slider.value;

    if (canvasObj.isDrawingMode) {
        drawButton.classList.add("btn-danger");
    }
    else {
        drawButton.classList.remove("btn-danger");
    }
}

// Update brush size from slider
let slider = document.getElementById("width");
var output = document.getElementById("size");
output.innerHTML = 'Brush Size: ' + slider.value;

slider.oninput = function () {
    output.innerHTML = 'Brush Size: ' + slider.value;
    canvasObj.freeDrawingBrush.width = slider.value;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

DisplayList();
syncInspectorWithSelection();