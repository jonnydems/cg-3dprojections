import { Matrix, Vector } from "./matrix.js";
import * as CG from './transforms.js';


const LEFT =   32; // binary 100000
const RIGHT =  16; // binary 010000
const BOTTOM = 8;  // binary 001000
const TOP =    4;  // binary 000100
const FAR =    2;  // binary 000010
const NEAR =   1;  // binary 000001
const FLOAT_EPSILON = 0.000001;

class Renderer {
    // canvas:              object ({id: __, width: __, height: __})
    // scene:               object (...see description on Canvas)
    constructor(canvas, scene) {
        this.canvas = document.getElementById(canvas.id);
        this.canvas.width = canvas.width;
        this.canvas.height = canvas.height;
        this.ctx = this.canvas.getContext('2d');
        this.scene = this.processScene(scene);
        this.enable_animation = true;  // <-- disabled for easier debugging; enable for animation
        this.start_time = null;
        this.prev_time = null;
        this.keysPressed = {};

        // Add event listeners for keydown and keyup events
        window.addEventListener('keydown', (event) => {
            // console.log(event.key + " pressed");
            this.keysPressed[event.key] = true;
        });
        
        window.addEventListener('keyup', (event) => {
            // console.log(event.key + " released");
            this.keysPressed[event.key] = false;
        });
    }
    mat4x4Rotation(axis, angle) {
        let [x, y, z] = axis;
        let c = Math.cos(angle);
        let s = Math.sin(angle);
        let t = 1 - c;
    
        let rotationMatrix = new Matrix(4, 4);
        rotationMatrix.values = [
            [t*x*x + c,     t*x*y - z*s,  t*x*z + y*s,  0],
            [t*x*y + z*s,   t*y*y + c,    t*y*z - x*s,  0],
            [t*x*z - y*s,   t*y*z + x*s,  t*z*z + c,    0],
            [0,             0,            0,            1]
        ];
    
        return rotationMatrix;
    }
    //
    updateTransforms(time, delta_time) {
        // Check for key presses
        if (this.keysPressed['w']) {
            this.moveForward();
        }
        if (this.keysPressed['a']) {
            this.moveLeft();
        }
        if (this.keysPressed['s']) {
            this.moveBackward();
        }
        if (this.keysPressed['d']) {
            this.moveRight();
        }
        if (this.keysPressed['ArrowLeft']) {
            this.rotateLeft();
        }
        if (this.keysPressed['ArrowRight']) {
            this.rotateRight();
        }
        for (let i = 0; i < this.scene.models.length; i++) {
            let model = this.scene.models[i];
            if (model.animation) {
                let rotationAxis = null;
                if (model.animation.axis === 'x') {
                    rotationAxis = new Vector(3)
                    rotationAxis.values = [1, 0, 0];
                } else if (model.animation.axis === 'y') {
                    rotationAxis = new Vector(3)
                    rotationAxis.values = [0, 1, 0];
                } else if (model.animation.axis === 'z') {
                    rotationAxis = new Vector(3)
                    rotationAxis.values = [0, 0, 1];
                }
                if (rotationAxis) {
                    // Calculate rotation angle based on revolutions per second
                    let rotationSpeed = model.animation.rps * 2 * Math.PI; // Convert revolutions per second to radians per second
                    let rotationAngle = rotationSpeed * delta_time / 1000; // Convert milliseconds to seconds
                    let rotationMatrix = new matrix()
                    if (model.animation.axis === 'x') {
                        rotationMatrix = CG.mat4x4RotationX(rotationAxis, rotationAngle);
                    }
                    if (model.animation.axis === 'y') {
                        rotationMatrix = CG.mat4x4RotationY(rotationAxis, rotationAngle);
                    }
                    if (model.animation.axis === 'z') {
                        rotationMatrix = CG.mat4x4RotationZ(rotationAxis, rotationAngle);
                    }
                    // Translate model to its center, rotate, and translate back
                    let translationToCenter = CG.mat4x4Translate(new Matrix(4, 4), -model.center.x, -model.center.y, -model.center.z);
                    let translationBack = CG.mat4x4Translate(new Matrix(4, 4), model.center.x, model.center.y, model.center.z);
    
                    // Apply transformations
                    model.matrix = Matrix.multiply([translationBack, rotationMatrix, translationToCenter, model.matrix]);
                }
            }
        }
        // TODO: update any other transformations needed for animation
    }

    //
    rotateLeft() {
        const angle = 0.1; // Adjust as needed
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        
        // Translate SRP to origin (subtract PRP)
        let translatedSRP = this.scene.view.srp.subtract(this.scene.view.prp);

        // Rotate SRP around v-axis
        let newSRP = new Vector(3)
        newSRP.values = [
            translatedSRP.x * cosAngle - translatedSRP.z * sinAngle,
            translatedSRP.y,
            translatedSRP.x * sinAngle + translatedSRP.z * cosAngle
        ];
    
        // Translate SRP back to original position (add PRP)
        this.scene.view.srp.values = [
            newSRP.x + this.scene.view.prp.x,
            newSRP.y + this.scene.view.prp.y,
            newSRP.z + this.scene.view.prp.z
        ];
    
        // Redraw scene after rotation
        this.draw();
    }
    
    rotateRight() {
        const angle = -0.1; // Adjust as needed
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        
        // Translate SRP to origin (subtract PRP)
        let translatedSRP = this.scene.view.srp.subtract(this.scene.view.prp);

        // Rotate SRP around v-axis
        let newSRP = new Vector(3)
        newSRP.values = [
            translatedSRP.x * cosAngle - translatedSRP.z * sinAngle,
            translatedSRP.y,
            translatedSRP.x * sinAngle + translatedSRP.z * cosAngle
        ];
    
        // Translate SRP back to original position (add PRP)
        this.scene.view.srp.values = [
            newSRP.x + this.scene.view.prp.x,
            newSRP.y + this.scene.view.prp.y,
            newSRP.z + this.scene.view.prp.z
        ];
    
        // Redraw scene after rotation
        this.draw();
    }
    
    //
    moveLeft() {
        // Translate PRP and SRP along the u-axis (left)
        const translationAmount = 1; // Adjust as needed
        this.scene.view.prp.x -= translationAmount;
        this.scene.view.srp.x -= translationAmount;
        // Redraw scene after translation
        this.draw();
    }
    
    moveRight() {
        // Translate PRP and SRP along the u-axis (right)
        const translationAmount = 1; // Adjust as needed
        this.scene.view.prp.x += translationAmount;
        this.scene.view.srp.x += translationAmount;
        // Redraw scene after translation
        this.draw();
    }
    
    moveBackward() {
        console.log(this.scene.view.prp);
        // Translate PRP and SRP along the n-axis (backward)
        const translationAmount = 1; // Adjust as needed
        this.scene.view.prp.z += translationAmount;
        this.scene.view.srp.z += translationAmount;
        // Redraw scene after translation
        this.draw();
    }
    
    moveForward() {
        // console.log("Moving forward");
        // Translate PRP and SRP along the n-axis (forward)
        const translationAmount = 1; // Adjust as needed
        this.scene.view.prp.z -= translationAmount;
        this.scene.view.srp.z -= translationAmount;
        // Redraw scene after translation
        this.draw();
    }

    //
    draw() {
        // console.log("Drawing scene");
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // TODO: implement drawing here!
    
        let perspMat = CG.mat4x4Perspective(this.scene.view.prp, this.scene.view.srp, this.scene.view.vup, this.scene.view.clip);
        let mPerMat = CG.mat4x4MPer();
        let viewportMat = CG.mat4x4Viewport(this.canvas.width, this.canvas.height);
    
        // For each model

        for (let i = 0; i < this.scene.models.length; i++) {
            let model = this.scene.models[i];
            let newVertices = [];
    
            //   * For each vertex
                //     * transform endpoints to canonical view volume
                //     * project to 2D
            for (let j = 0; j < model.vertices.length; j++) {
                let vert = model.vertices[j];
                let perspVert = Matrix.multiply([perspMat, vert]);
                let mPerVert = Matrix.multiply([mPerMat, perspVert]);
                newVertices.push(mPerVert);
            }
            //   * For each line segment in each edge
                //     * translate/scale to viewport (i.e. window)
                //     * draw line
            for (let k = 0; k < model.edges.length; k++) {
                let edges = model.edges[k];
                
                for (let l = 0; l < edges.length - 1; l++) {
                    let vertex1 = newVertices[edges[l]];
                    let vertex2 = newVertices[edges[l + 1]];
                    
                    let viewPortVert1 = Matrix.multiply([viewportMat, vertex1]);
                    let viewPortVert2 = Matrix.multiply([viewportMat, vertex2]);
                    
                    this.drawLine(viewPortVert1.x / viewPortVert1.w, viewPortVert1.y / viewPortVert1.w, viewPortVert2.x / viewPortVert2.w, viewPortVert2.y / viewPortVert2.w);
                }
            }
        }

        //     * clip in 3D



    }

    // Get outcode for a vertex
    // vertex:       Vector4 (transformed vertex in homogeneous coordinates)
    // z_min:        float (near clipping plane in canonical view volume)
    outcodePerspective(vertex, z_min) {
        let outcode = 0;
        if (vertex.x < (vertex.z - FLOAT_EPSILON)) {
            outcode += LEFT;
        }
        else if (vertex.x > (-vertex.z + FLOAT_EPSILON)) {
            outcode += RIGHT;
        }
        if (vertex.y < (vertex.z - FLOAT_EPSILON)) {
            outcode += BOTTOM;
        }
        else if (vertex.y > (-vertex.z + FLOAT_EPSILON)) {
            outcode += TOP;
        }
        if (vertex.z < (-1.0 - FLOAT_EPSILON)) {
            outcode += FAR;
        }
        else if (vertex.z > (z_min + FLOAT_EPSILON)) {
            outcode += NEAR;
        }
        return outcode;
    }

    // Clip line - should either return a new line (with two endpoints inside view volume)
    //             or null (if line is completely outside view volume)
    // line:         object {pt0: Vector4, pt1: Vector4}
    // z_min:        float (near clipping plane in canonical view volume)
    clipLinePerspective(line, z_min) {
        let result = null;
        let p0 = Vector3(line.pt0.x, line.pt0.y, line.pt0.z); 
        let p1 = Vector3(line.pt1.x, line.pt1.y, line.pt1.z);
        let out0 = this.outcodePerspective(p0, z_min);
        let out1 = this.outcodePerspective(p1, z_min);
        
        
        //TODO: implement clipping here!
        return result;
    }

    //
    animate(timestamp) {
        // Get time and delta time for animation
        if (this.start_time === null) {
            this.start_time = timestamp;
            this.prev_time = timestamp;
        }
        let time = timestamp - this.start_time;
        let delta_time = timestamp - this.prev_time;

        // Update transforms for animation
        this.updateTransforms(time, delta_time);

        // Draw slide
        this.draw();

        // Invoke call for next frame in animation
        if (this.enable_animation) {
            window.requestAnimationFrame((ts) => {
                this.animate(ts);
            });
        }

        // Update previous time to current one for next calculation of delta time
        this.prev_time = timestamp;
    }

    //
    updateScene(scene) {
        this.scene = this.processScene(scene);
        if (!this.enable_animation) {
            this.draw();
        }
    }

    //
    processScene(scene) {
        let processed = {
            view: {
                prp: CG.Vector3(scene.view.prp[0], scene.view.prp[1], scene.view.prp[2]),
                srp: CG.Vector3(scene.view.srp[0], scene.view.srp[1], scene.view.srp[2]),
                vup: CG.Vector3(scene.view.vup[0], scene.view.vup[1], scene.view.vup[2]),
                clip: [...scene.view.clip]
            },
            models: []
        };

        for (let i = 0; i < scene.models.length; i++) {
            let model = { type: scene.models[i].type };
            if (model.type === 'generic') {
                model.vertices = [];
                model.edges = JSON.parse(JSON.stringify(scene.models[i].edges));
                for (let j = 0; j < scene.models[i].vertices.length; j++) {
                    model.vertices.push(CG.Vector4(scene.models[i].vertices[j][0],
                                                   scene.models[i].vertices[j][1],
                                                   scene.models[i].vertices[j][2],
                                                   1));
                    if (scene.models[i].hasOwnProperty('animation')) {
                        model.animation = JSON.parse(JSON.stringify(scene.models[i].animation));
                    }
                }
            }

            else if(model.type === 'cube') {

                let model1 = scene.models[i];
                model.vertices = [];
                let halfWidth = model1.width / 2;
                let halfHeight = model1.height / 2;
                let halfDepth = model1.depth / 2;
                let centerx = model1.center[0];
                
                let centery = model1.center[1];
                let centerz = model1.center[2];

                for (let sz = 1; sz >= -1; sz -= 2) {
                    model.vertices.push(CG.Vector4(centerx - halfWidth,
                        centery + halfHeight,
                        centerz + sz*halfDepth,
                        1));
                    model.vertices.push(CG.Vector4(centerx + halfWidth,
                        centery + halfHeight,
                        centerz + sz*halfDepth,
                        1));
                    model.vertices.push(CG.Vector4(centerx + halfWidth,
                        centery - halfHeight,
                        centerz + sz*halfDepth,
                        1));
                    model.vertices.push(CG.Vector4(centerx - halfWidth,
                        centery - halfHeight,
                        centerz + sz*halfDepth,
                        1));
                }
                

                model.edges = [];
                model.edges.push([0, 1, 2, 3, 0]);
                model.edges.push([4, 5, 6, 7, 4]);
                
                model.edges.push([0, 4]);
                model.edges.push([1, 5]);
                model.edges.push([2, 6]);
                model.edges.push([3, 7]);
            }
            else if (model.type == "cylinder") {
                let model1 = scene.models[i];
                model.vertices = [];
                model.edges = [];
                let halfHeight = model1.height/2
                let radius = model1.radius
                let interval = (2 * Math.PI) / model1.sides;
                for (let sign = 1; sign > -2; sign--) {
                    for (let i = 0; i < model1.sides; i++) {
                        halfHeight *= sign;
                        
                        model.vertices.push(CG.Vector4(model1.center[0] + radius * Math.cos(i*interval),
                                                       model1.center[1] + halfHeight,
                                                       model1.center[2] + radius * Math.sin(i*interval), 
                                                       1));
                    }
                }
                //let top = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0];
                //let bottom =[12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 12];
                let top = [];
                let bottom = [];
                for (let i = 0; i < model1.sides*2; i++) {
                    if (i > 11) {
                        bottom.push(i);
                    }
                    else {
                        top.push(i)
                    }
                }
                bottom.push(model1.sides);
                top.push(0);
                model.edges.push(top);
                model.edges.push(bottom);
                for (let i = 0; i < top.length-1; i++) {
                    model.edges.push([top[i], bottom[i]]);
                }
            }

            else if (model.type === "sphere") {
                let model1 = scene.models[i];
                model.vertices = [];
                model.edges = [];
                let radius = model1.radius;

                for (let i = 0; i <= model1.stacks; i++) {
                    let angle1 = Math.PI * i / model1.stacks;
                    let r = radius * Math.sin(angle1);

                    for (let j = 0; j <= model1.slices; j++) {
                        let angle2 = 2 * Math.PI * j / model1.slices;

                        model.vertices.push(CG.Vector4(model1.center[0] + r * Math.cos(angle2),
                                                       model1.center[1] + radius * Math.cos(angle1),
                                                       model1.center[2] + r * Math.sin(angle2), 1));

                            if (i!=model1.stacks && j!=model1.slices) {
                                model.edges.push([i * (model1.slices + 1) + j, i * (model1.slices + 1) + j + 1]);
                                model.edges.push([i * (model1.slices + 1) + j, i * (model1.slices + 1) + j + model1.slices + 1]);
                            }
                        
                    }
                }
                console.log(model.edges);
            }
            else if (model.type === "cone") {
                let model1 = scene.models[i];
                model.vertices = [];
                model.edges = [];
                let radius = model1.radius;
                let halfHeight = model1.height /2;
                let interval = (2 * Math.PI) / model1.sides;

                for (let i = 0; i < model1.sides; i++) {
                    model.vertices.push(CG.Vector4(model1.center[0] + radius * Math.cos(i * interval),
                                                   model1.center[1], model1.center[2] + radius * Math.sin(i * interval),
                                                   1));
                }

                model.vertices.push(CG.Vector4(model1.center[0], model1.center[1] + halfHeight, model1.center[2], 1));

                for (let i = 0; i < model1.sides; i++) {
                    model.edges.push([i, model1.sides]);
                }
            
                for (let i = 0; i < model1.sides - 1; i++) {
                    model.edges.push([i, i + 1]);
                }
                model.edges.push([model1.sides - 1, 0]);
                
                model.edges.push([model1.sides, 1]);
            }

            else {
                model.center = CG.Vector4(scene.models[i].center[0],
                                       scene.models[i].center[1],
                                       scene.models[i].center[2],
                                       1);
                for (let key in scene.models[i]) {
                    if (scene.models[i].hasOwnProperty(key) && key !== 'type' && key != 'center') {
                        model[key] = JSON.parse(JSON.stringify(scene.models[i][key]));
                    }
                }
            }

            model.matrix = new Matrix(4, 4);
            processed.models.push(model);
        }

        return processed;
    }
    
    // x0:           float (x coordinate of p0)
    // y0:           float (y coordinate of p0)
    // x1:           float (x coordinate of p1)
    // y1:           float (y coordinate of p1)
    drawLine(x0, y0, x1, y1) {
        this.ctx.strokeStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();

        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(x0 - 2, y0 - 2, 4, 4);
        this.ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
    }
};

export { Renderer };

