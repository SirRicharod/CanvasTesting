// Create a Fabric.js "Canvas" object that is tied to the HTML <canvas> element:
let canvasObj = new fabric.Canvas('mainCanvasId');
const printArea = document.querySelector(".print-area");
const canvasOverlayToggle = document.getElementById("toggle-canvas-overlay");
const canvasOverlayToggleIcon = document.getElementById("toggle-canvas-overlay-icon");

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

canvasObj.on('mouse:dblclick', function (options) {
    if (options.target) {
        canvasObj.bringObjectToFront(options.target);
        canvasObj.renderAll();
        DisplayList();
    }
});

// canvasObj.on('mouse:down', function (options) {
//     if (options.target) {
//         console.log(options.target);
//         DisplayList();
//     }
// });

const displayList = document.getElementById("list");
const selectedType = document.getElementById("selected-type");
const textControlsGroup = document.getElementById("text-controls-group");
const deleteSelectedButton = document.getElementById("delete-selected");

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

let isUpdatingInspector = false;

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

function setInspectorEnabled(isEnabled) {
    Object.values(inspectorFields).forEach((field) => {
        field.disabled = !isEnabled;
    });
}

function isTextObject(object) {
    return ["text", "i-text", "textbox"].includes(object.type);
}

function setTextControlsVisible(isVisible) {
    textControlsGroup.style.display = isVisible ? "contents" : "none";
}

function syncInspectorWithSelection() {
    const selectedObject = canvasObj.getActiveObject();

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

    const scaledWidth = selectedObject.getScaledWidth ? selectedObject.getScaledWidth() : (selectedObject.width || 0);
    const scaledHeight = selectedObject.getScaledHeight ? selectedObject.getScaledHeight() : (selectedObject.height || 0);

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

function applyInspectorEdits() {
    if (isUpdatingInspector) return;

    const selectedObject = canvasObj.getActiveObject();
    if (!selectedObject || selectedObject.type === "activeSelection") return;

    const left = Number(inspectorFields.left.value);
    const top = Number(inspectorFields.top.value);
    const width = Number(inspectorFields.width.value);
    const height = Number(inspectorFields.height.value);
    const radius = Number(inspectorFields.radius.value);
    const strokeWidth = Number(inspectorFields.strokeWidth.value);
    const angle = Number(inspectorFields.angle.value);

    if (!Number.isNaN(left)) selectedObject.set("left", left);
    if (!Number.isNaN(top)) selectedObject.set("top", top);

    if (!Number.isNaN(width) && width > 0) {
        const baseWidth = selectedObject.width || 1;
        selectedObject.set("scaleX", width / baseWidth);
    }

    if (!Number.isNaN(height) && height > 0) {
        const baseHeight = selectedObject.height || 1;
        selectedObject.set("scaleY", height / baseHeight);
    }

    if (selectedObject.type === "circle" && !Number.isNaN(radius) && radius > 0) {
        selectedObject.set("radius", radius);
    }

    if (!Number.isNaN(strokeWidth) && strokeWidth >= 0) {
        selectedObject.set("strokeWidth", strokeWidth);
    }

    if (!Number.isNaN(angle)) {
        selectedObject.set("angle", angle);
    }

    selectedObject.set("fill", inspectorFields.fill.value || selectedObject.fill);
    selectedObject.set("stroke", inspectorFields.stroke.value || selectedObject.stroke);

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

    selectedObject.setCoords();
    canvasObj.requestRenderAll();
    DisplayList();
}

Object.values(inspectorFields).forEach((field) => {
    field.addEventListener("input", applyInspectorEdits);
    field.addEventListener("change", applyInspectorEdits);
});

deleteSelectedButton.addEventListener("click", function () {
    const selectedObject = canvasObj.getActiveObject();
    if (!selectedObject || selectedObject.type === "activeSelection") return;

    canvasObj.remove(selectedObject);
    canvasObj.discardActiveObject();
    canvasObj.requestRenderAll();
    DisplayList();
    syncInspectorWithSelection();
});

canvasObj.on("selection:created", syncInspectorWithSelection);
canvasObj.on("selection:updated", syncInspectorWithSelection);
canvasObj.on("selection:cleared", syncInspectorWithSelection);
canvasObj.on("object:modified", syncInspectorWithSelection);
canvasObj.on("object:moving", syncInspectorWithSelection);
canvasObj.on("object:scaling", syncInspectorWithSelection);

function moveObjectLayer(object, direction) {
    const objects = canvasObj.getObjects();
    const currentIndex = objects.indexOf(object);
    if (currentIndex === -1) return;

    const nextIndex = direction === "forward"
        ? Math.min(objects.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);

    if (nextIndex === currentIndex) return;

    if (typeof canvasObj.moveObjectTo === "function") {
        canvasObj.moveObjectTo(object, nextIndex);
    } else {
        canvasObj.remove(object);
        canvasObj.insertAt(object, nextIndex);
    }

    canvasObj.requestRenderAll();
    DisplayList();
}

function DisplayList() {
    displayList.innerHTML = "";

    const currentObjects = canvasObj.getObjects();
    currentObjects.forEach((object, index) => {
        const listItem = document.createElement("div");
        listItem.className = "layer-item d-flex align-items-center gap-2 justify-content-between";

        const label = document.createElement("span");
        label.textContent = `${index}: ${object.type}`;

        const controls = document.createElement("div");
        controls.className = "d-flex align-items-center gap-1";

        const backButton = document.createElement("button");
        backButton.className = "btn btn-sm btn-outline-secondary";
        backButton.innerHTML = '<i class="bi bi-caret-down-fill"></i>';
        backButton.title = "Send backward";
        backButton.disabled = index === 0;
        backButton.addEventListener("click", function () {
            moveObjectLayer(object, "backward");
        });

        const forwardButton = document.createElement("button");
        forwardButton.className = "btn btn-sm btn-outline-secondary";
        forwardButton.innerHTML = '<i class="bi bi-caret-up-fill"></i>';
        forwardButton.title = "Bring forward";
        forwardButton.disabled = index === currentObjects.length - 1;
        forwardButton.addEventListener("click", function () {
            moveObjectLayer(object, "forward");
        });

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

DisplayList();
syncInspectorWithSelection();