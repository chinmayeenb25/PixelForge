let offsetX = 0;
let offsetY = 0;

let isPanning = false;

let lastMouse = null;

let panMode = false;

const canvas = document.getElementById("pixelCanvas");

const ctx = canvas.getContext("2d");

const canvasWrapper = document.getElementById("canvasWrapper");

const colorPicker = document.getElementById("colorPicker");

const currentColor = document.getElementById("currentColor");

const colorHex = document.getElementById("colorHex");

const hexInput = document.getElementById("hexInput");

const recentColorsContainer =
    document.getElementById("recentColors");

const canvasWidthInput =
    document.getElementById("canvasWidth");

const canvasHeightInput =
    document.getElementById("canvasHeight");

const currentToolText =
    document.getElementById("currentTool");

const cursorPosition =
    document.getElementById("cursorPosition");

const canvasInfo =
    document.getElementById("canvasInfo");

const zoomLevel =
    document.getElementById("zoomLevel");

const statusZoom =
    document.getElementById("statusZoom");
const panButton=document.getElementById("panToggleBtn");

panButton.addEventListener("click",()=>{

panMode=!panMode;

panButton.classList.toggle("active");

});

let gridWidth = 32;

let gridHeight = 32;

let currentColorValue = "#000000";

let currentTool = "pencil";

let zoom = 100;

let showGrid = true;

let isDrawing = false;

let startCell = null;

let recentColors = [];

let undoStack = [];

let redoStack = [];
document

.getElementById("saveBtn")

.addEventListener("click",saveProject);


document

.getElementById("loadBtn")

.addEventListener("click",loadProject);

function createCanvas(width, height) {

    gridWidth = width;

    gridHeight = height;


    canvas.width = gridWidth;

    canvas.height = gridHeight;


    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        0,
        0,
        gridWidth,
        gridHeight
    );


    updateCanvasSize();

    updateCanvasInfo();

    saveHistory();

}


function updateCanvasSize() {

    const availableWidth =
        canvasWrapper.clientWidth - 80;

    const availableHeight =
        canvasWrapper.clientHeight - 80;


    const scaleX =
        availableWidth / gridWidth;

    const scaleY =
        availableHeight / gridHeight;


    const scale =
        Math.min(scaleX, scaleY);


    const finalScale =
        Math.max(1, scale * (zoom / 100));


    canvas.style.width =
        `${gridWidth * finalScale}px`;

    canvas.style.height =
        `${gridHeight * finalScale}px`;

}


function updateCanvasInfo() {

    canvasInfo.textContent =
        `${gridWidth} × ${gridHeight}`;

}


createCanvas(
    gridWidth,
    gridHeight
);

function setColor(color) {

    if (!/^#[0-9A-F]{6}$/i.test(color)) {

        return;

    }


    currentColorValue =
        color.toUpperCase();


    colorPicker.value =
        currentColorValue;


    currentColor.style.background =
        currentColorValue;


    colorHex.textContent =
        currentColorValue;


    hexInput.value =
        currentColorValue;


    addRecentColor(
        currentColorValue
    );

}


function addRecentColor(color) {

    if (recentColors.includes(color)) {

        recentColors =
            recentColors.filter(
                item => item !== color
            );

    }


    recentColors.unshift(color);


    recentColors =
        recentColors.slice(0, 12);


    renderRecentColors();

}


function renderRecentColors() {

    recentColorsContainer.innerHTML =
        "";


    recentColors.forEach(color => {

        const colorElement =
            document.createElement("div");


        colorElement.className =
            "recent-color";


        colorElement.style.background =
            color;


        colorElement.title =
            color;


        colorElement.addEventListener(
            "click",
            () => setColor(color)
        );


        recentColorsContainer.appendChild(
            colorElement
        );

    });

}


colorPicker.addEventListener(
    "input",
    event => {

        setColor(
            event.target.value
        );

    }
);


hexInput.addEventListener(
    "change",
    event => {

        let value =
            event.target.value;


        if (!value.startsWith("#")) {

            value =
                "#" + value;

        }


        setColor(value);

    }
);


document
    .getElementById("addColorBtn")
    .addEventListener(
        "click",
        () => setColor(hexInput.value)
    );

document
    .querySelectorAll(".tool")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".tool")
                    .forEach(
                        btn =>
                            btn.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                currentTool =
                    button.dataset.tool;


                currentToolText.textContent =
                    button
                        .querySelector("span")
                        .textContent;

            }
        );

    });




function getCellFromMouse(event) {

    const rect =
        canvas.getBoundingClientRect();


    const scaleX =
        canvas.width /
        rect.width;


    const scaleY =
        canvas.height /
        rect.height;


    const x =
        Math.floor(
            (event.clientX - rect.left)
            * scaleX
        );


    const y =
        Math.floor(
            (event.clientY - rect.top)
            * scaleY
        );


    return {

        x: Math.max(
            0,
            Math.min(
                gridWidth - 1,
                x
            )
        ),

        y: Math.max(
            0,
            Math.min(
                gridHeight - 1,
                y
            )
        )

    };

}

function drawPixel(x, y) {

    if (
        x < 0 ||
        x >= gridWidth ||
        y < 0 ||
        y >= gridHeight
    ) {

        return;

    }


    if (currentTool === "pencil") {

        ctx.fillStyle =
            currentColorValue;


        ctx.fillRect(
            x,
            y,
            1,
            1
        );

    }


    else if (
        currentTool === "eraser"
    ) {

        ctx.fillStyle =
            "#ffffff";


        ctx.fillRect(
            x,
            y,
            1,
            1
        );

    }

}


function drawLine(
    x1,
    y1,
    x2,
    y2
) {

    const dx =
        Math.abs(x2 - x1);


    const dy =
        Math.abs(y2 - y1);


    const sx =
        x1 < x2 ? 1 : -1;


    const sy =
        y1 < y2 ? 1 : -1;


    let err =
        dx - dy;


    while (true) {

        drawPixel(
            x1,
            y1
        );


        if (
            x1 === x2 &&
            y1 === y2
        ) {

            break;

        }


        const e2 =
            2 * err;


        if (e2 > -dy) {

            err -= dy;

            x1 += sx;

        }


        if (e2 < dx) {

            err += dx;

            y1 += sy;

        }

    }

}


function drawRectangle(
    x1,
    y1,
    x2,
    y2
) {

    const minX =
        Math.min(x1, x2);


    const maxX =
        Math.max(x1, x2);


    const minY =
        Math.min(y1, y2);


    const maxY =
        Math.max(y1, y2);


    for (
        let x = minX;
        x <= maxX;
        x++
    ) {

        drawPixel(
            x,
            minY
        );


        drawPixel(
            x,
            maxY
        );

    }


    for (
        let y = minY;
        y <= maxY;
        y++
    ) {

        drawPixel(
            minX,
            y
        );


        drawPixel(
            maxX,
            y
        );

    }

}


function drawCircle(
    cx,
    cy,
    radius
) {

    let x = radius;

    let y = 0;

    let decision =
        1 - radius;


    while (x >= y) {

        drawPixel(
            cx + x,
            cy + y
        );


        drawPixel(
            cx + y,
            cy + x
        );


        drawPixel(
            cx - y,
            cy + x
        );


        drawPixel(
            cx - x,
            cy + y
        );


        drawPixel(
            cx - x,
            cy - y
        );


        drawPixel(
            cx - y,
            cy - x
        );


        drawPixel(
            cx + y,
            cy - x
        );


        drawPixel(
            cx + x,
            cy - y
        );


        y++;


        if (decision <= 0) {

            decision +=
                2 * y + 1;

        }

        else {

            x--;

            decision +=
                2 * (y - x) + 1;

        }

    }

}



function floodFill(
    startX,
    startY
) {

    const imageData =
        ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );


    const pixels =
        imageData.data;


    const startIndex =
        (startY * canvas.width + startX)
        * 4;


    const targetColor = {

        r: pixels[startIndex],

        g: pixels[startIndex + 1],

        b: pixels[startIndex + 2],

        a: pixels[startIndex + 3]

    };


    const fillColor =
        hexToRgb(
            currentColorValue
        );


    if (
        targetColor.r === fillColor.r &&
        targetColor.g === fillColor.g &&
        targetColor.b === fillColor.b
    ) {

        return;

    }


    const queue = [

        [startX, startY]

    ];


    while (queue.length > 0) {

        const [
            x,
            y
        ] =
            queue.shift();


        if (
            x < 0 ||
            x >= canvas.width ||
            y < 0 ||
            y >= canvas.height
        ) {

            continue;

        }


        const index =
            (y * canvas.width + x)
            * 4;


        if (

            pixels[index] !==
                targetColor.r ||

            pixels[index + 1] !==
                targetColor.g ||

            pixels[index + 2] !==
                targetColor.b ||

            pixels[index + 3] !==
                targetColor.a

        ) {

            continue;

        }


        pixels[index] =
            fillColor.r;


        pixels[index + 1] =
            fillColor.g;


        pixels[index + 2] =
            fillColor.b;


        pixels[index + 3] =
            255;


        queue.push(
            [x + 1, y]
        );


        queue.push(
            [x - 1, y]
        );


        queue.push(
            [x, y + 1]
        );


        queue.push(
            [x, y - 1]
        );

    }


    ctx.putImageData(
        imageData,
        0,
        0
    );

}


function hexToRgb(hex) {

    return {

        r: parseInt(
            hex.substring(1, 3),
            16
        ),

        g: parseInt(
            hex.substring(3, 5),
            16
        ),

        b: parseInt(
            hex.substring(5, 7),
            16
        )

    };

}
canvasWrapper.addEventListener("mousedown",(e)=>{

if(!panMode)return;

isPanning=true;

lastMouse={

x:e.clientX,

y:e.clientY

};

canvasWrapper.style.cursor="grabbing";

});
window.addEventListener("mousemove",(e)=>{

if(!isPanning)return;

const dx=e.clientX-lastMouse.x;

const dy=e.clientY-lastMouse.y;

canvasWrapper.scrollLeft-=dx;

canvasWrapper.scrollTop-=dy;

lastMouse={

x:e.clientX,

y:e.clientY

};

});


canvas.addEventListener(
    "mousedown",
    event => {

        const cell =
            getCellFromMouse(event);


        isDrawing =
            true;


        startCell =
            cell;


        if (
            currentTool === "pencil" ||
            currentTool === "eraser"
        ) {

            drawPixel(
                cell.x,
                cell.y
            );

        }


        else if (
            currentTool === "fill"
        ) {

            floodFill(
                cell.x,
                cell.y
            );


            saveHistory();

        }

    }
);


canvas.addEventListener(
    "mousemove",
    event => {

        const cell =
            getCellFromMouse(event);


        cursorPosition.textContent =
            `${cell.x}, ${cell.y}`;


        if (
            !isDrawing
        ) {

            return;

        }


        if (
            currentTool === "pencil" ||
            currentTool === "eraser"
        ) {

            drawPixel(
                cell.x,
                cell.y
            );

        }

    }
);


canvas.addEventListener(
    "mouseup",
    event => {

        if (
            !isDrawing
        ) {

            return;

        }


        const endCell =
            getCellFromMouse(event);


        if (
            currentTool === "line"
        ) {

            drawLine(

                startCell.x,

                startCell.y,

                endCell.x,

                endCell.y

            );

        }


        else if (
            currentTool === "rectangle"
        ) {

            drawRectangle(

                startCell.x,

                startCell.y,

                endCell.x,

                endCell.y

            );

        }


        else if (
            currentTool === "circle"
        ) {

            const radius =
                Math.round(

                    Math.sqrt(

                        Math.pow(
                            endCell.x -
                            startCell.x,
                            2
                        )

                        +

                        Math.pow(
                            endCell.y -
                            startCell.y,
                            2
                        )

                    )

                );


            drawCircle(

                startCell.x,

                startCell.y,

                radius

            );

        }


        isDrawing =
            false;


        saveHistory();

    }
);


canvas.addEventListener(
    "mouseleave",
    () => {

        cursorPosition.textContent =
            "-";

    }
);



function saveHistory() {

    undoStack.push(

        ctx.getImageData(

            0,

            0,

            canvas.width,

            canvas.height

        )

    );


    if (
        undoStack.length > 30
    ) {

        undoStack.shift();

    }


    redoStack =
        [];

}


function undo() {

    if (
        undoStack.length <= 1
    ) {

        return;

    }


    const current =
        undoStack.pop();


    redoStack.push(
        current
    );


    const previous =
        undoStack[
            undoStack.length - 1
        ];


    ctx.putImageData(
        previous,
        0,
        0
    );

}


function redo() {

    if (
        redoStack.length === 0
    ) {

        return;

    }


    const image =
        redoStack.pop();


    undoStack.push(
        image
    );


    ctx.putImageData(
        image,
        0,
        0
    );

}


document
    .getElementById("undoBtn")
    .addEventListener(
        "click",
        undo
    );


document
    .getElementById("redoBtn")
    .addEventListener(
        "click",
        redo
    );




document
    .getElementById("clearBtn")
    .addEventListener(
        "click",
        () => {

            if (
                !confirm(
                    "Clear the entire canvas?"
                )
            ) {

                return;

            }


            ctx.fillStyle =
                "#ffffff";


            ctx.fillRect(

                0,

                0,

                canvas.width,

                canvas.height

            );


            saveHistory();

        }
    );




document
    .getElementById("createCanvasBtn")
    .addEventListener(
        "click",
        () => {

            const width =
                parseInt(
                    canvasWidthInput.value
                );


            const height =
                parseInt(
                    canvasHeightInput.value
                );


            if (
                width < 4 ||
                height < 4 ||
                width > 128 ||
                height > 128
            ) {

                alert(
                    "Canvas size must be between 4 and 128."
                );


                return;

            }


            createCanvas(
                width,
                height
            );

        }
    );



function updateZoom() {

    zoomLevel.textContent =
        `${zoom}%`;


    statusZoom.textContent =
        `${zoom}%`;


    updateCanvasSize();

}


document
    .getElementById("zoomInBtn")
    .addEventListener(
        "click",
        () => {

            zoom =
                Math.min(
                    1000,
                    zoom + 25
                );


            updateZoom();

        }
    );


document
    .getElementById("zoomOutBtn")
    .addEventListener(
        "click",
        () => {

            zoom =
                Math.max(
                    25,
                    zoom - 25
                );


            updateZoom();

        }
    );


document
    .getElementById("resetZoomBtn")
    .addEventListener(
        "click",
        () => {

            zoom =
                100;


            updateZoom();

        }
    );




document
    .getElementById("gridToggleBtn")
    .addEventListener(
        "click",
        event => {

            showGrid =
                !showGrid;


            event.target.classList.toggle(
                "active"
            );


            drawGrid();

        }
    );


function drawGrid(){

    if(!showGrid){

        canvas.style.backgroundImage="none";
        return;

    }

    const scale=canvas.clientWidth/canvas.width;

    canvas.style.backgroundImage=
    `
    linear-gradient(#d0d0d0 1px,transparent 1px),
    linear-gradient(90deg,#d0d0d0 1px,transparent 1px)
    `;

    canvas.style.backgroundSize=
    `${scale}px ${scale}px`;

}




document
    .getElementById("exportBtn")
    .addEventListener(
        "click",
        () => {

            const link =
                document.createElement(
                    "a"
                );


            link.download =
                "pixelforge-art.png";


            link.href =
                canvas.toDataURL(
                    "image/png"
                );


            link.click();

        }
    );




document.addEventListener(
    "keydown",
    event => {

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "z"
        ) {

            event.preventDefault();

            undo();

        }


        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "y"
        ) {

            event.preventDefault();

            redo();

        }


        if (
            event.key.toLowerCase() === "p"
        ) {

            selectTool(
                "pencil"
            );

        }


        if (
            event.key.toLowerCase() === "e"
        ) {

            selectTool(
                "eraser"
            );

        }


        if (
            event.key.toLowerCase() === "f"
        ) {

            selectTool(
                "fill"
            );

        }
      if(event.ctrlKey && event.key==="s"){

event.preventDefault();

saveProject();

}

if(event.ctrlKey && event.key==="o"){

event.preventDefault();

loadProject();

}

if(event.key==="g"){

document

.getElementById("gridToggleBtn")

.click();

}

if(event.key==="l"){

selectTool("line");

}

if(event.key==="r"){

selectTool("rectangle");

}

if(event.key==="c"){

selectTool("circle");

}

    }
);


function selectTool(toolName) {

    const button =
        document.querySelector(
            `[data-tool="${toolName}"]`
        );


    if (
        button
    ) {

        button.click();

    }

}




window.addEventListener(
    "resize",
    updateCanvasSize
);
drawGrid();
function saveProject(){

const project={

width:gridWidth,

height:gridHeight,

image:canvas.toDataURL(),

recentColors,

zoom

};

localStorage.setItem(

"pixelforge-project",

JSON.stringify(project)

);

alert("Project Saved");

}
function loadProject(){

const project=JSON.parse(

localStorage.getItem("pixelforge-project")

);

if(!project){

alert("No saved project");

return;

}

createCanvas(

project.width,

project.height

);

const img=new Image();

img.onload=function(){

ctx.drawImage(img,0,0);

saveHistory();

};

img.src=project.image;

recentColors=project.recentColors||[];

renderRecentColors();

zoom=project.zoom||100;

updateZoom();

}
setInterval(()=>{

saveProject();

},60000);
window.addEventListener("beforeunload",(e)=>{

saveProject();

e.preventDefault();

});
canvasWrapper.addEventListener("wheel",(e)=>{

if(!e.ctrlKey)return;

e.preventDefault();

if(e.deltaY<0){

zoom=Math.min(1000,zoom+10);

}else{

zoom=Math.max(20,zoom-10);

}

updateZoom();

});
async function cloudSave(){

const name=prompt("Project name");

if(!name)return;

await fetch("/save",{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

name,

image:canvas.toDataURL()

})

});

alert("Saved");

}
async function loadGallery(){

const res=await fetch("/projects");

const data=await res.json();

const gallery=document.getElementById("gallery");

gallery.innerHTML="";

gallery.classList.toggle("hidden");

data.forEach(project=>{

const img=document.createElement("img");

img.src=project.image;

img.title=project.name;

img.onclick=()=>loadProjectFromServer(project.id);

gallery.appendChild(img);

});

}
async function loadProjectFromServer(id){

const res=await fetch("/project/"+id);

const project=await res.json();

const img=new Image();

img.onload=function(){

ctx.clearRect(0,0,canvas.width,canvas.height);

ctx.drawImage(img,0,0);

saveHistory();

};

img.src=project.image;

}
async function deleteProject(id){

await fetch("/delete/"+id,{

method:"DELETE"

});

loadGallery();

}
document

.getElementById("cloudSaveBtn")

.onclick=cloudSave;


document

.getElementById("galleryBtn")

.onclick=loadGallery;