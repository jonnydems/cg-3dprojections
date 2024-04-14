import { Matrix } from "./matrix.js";
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
        this.enable_animation = false;  // <-- disabled for easier debugging; enable for animation
        this.start_time = null;
        this.prev_time = null;
        this.keysPressed = {};

        // Add event listeners for keydown and keyup events
        window.addEventListener('keydown', (event) => {
            console.log(event.key + " pressed");
            this.keysPressed[event.key] = true;
        });
        
        window.addEventListener('keyup', (event) => {
            console.log(event.key + " released");
            this.keysPressed[event.key] = false;
        });
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
    
        // TODO: update any other transformations needed for animation
    }

    //
    rotateLeft() {
        // Rotate the shape around its center
        const rotationAmount = 0.1; // Adjust as needed
    
        for (let i = 0; i < this.scene.models.length; i++) {
            // Calculate the center of the model
            let modelCenter = this.scene.models[i].center;
    
            // Translate to the origin (center)
            let translateToOrigin = CG.mat4x4Translate(-modelCenter.x, -modelCenter.y, -modelCenter.z);
    
            // Rotate around the origin
            let rotateAroundOrigin = CG.mat4x4RotateY(rotationAmount);
    
            // Translate back to the original position
            let translateBack = CG.mat4x4Translate(modelCenter.x, modelCenter.y, modelCenter.z);
    
            // Combine transformations
            let transformMatrix = Matrix.multiply([translateBack, rotateAroundOrigin, translateToOrigin]);
    
            // Apply transformation to each vertex
            for (let j = 0; j < this.scene.models[i].vertices.length; j++) {
                let transformedVertex = Matrix.multiply([transformMatrix, this.scene.models[i].vertices[j]]);
                this.scene.models[i].vertices[j] = transformedVertex;
            }
        }
    
        // Redraw scene after rotation
        this.draw();
    }
    
    rotateRight() {
        // Rotate the shape around its center
        const rotationAmount = -0.1; // Adjust as needed
    
        for (let i = 0; i < this.scene.models.length; i++) {
            // Calculate the center of the model
            let modelCenter = this.scene.models[i].center;
    
            // Translate to the origin (center)
            let translateToOrigin = CG.mat4x4Translate(-modelCenter.x, -modelCenter.y, -modelCenter.z);
    
            // Rotate around the origin
            let rotateAroundOrigin = CG.mat4x4RotateY(rotationAmount);
    
            // Translate back to the original position
            let translateBack = CG.mat4x4Translate(modelCenter.x, modelCenter.y, modelCenter.z);
    
            // Combine transformations
            let transformMatrix = Matrix.multiply([translateBack, rotateAroundOrigin, translateToOrigin]);
    
            // Apply transformation to each vertex
            for (let j = 0; j < this.scene.models[i].vertices.length; j++) {
                let transformedVertex = Matrix.multiply([transformMatrix, this.scene.models[i].vertices[j]]);
                this.scene.models[i].vertices[j] = transformedVertex;
            }
        }
    
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
        // Translate PRP and SRP along the n-axis (backward)
        const translationAmount = 1; // Adjust as needed
        this.scene.view.prp.z += translationAmount;
        this.scene.view.srp.z += translationAmount;
        // Redraw scene after translation
        this.draw();
    }
    
    moveForward() {
        console.log("Moving forward");
        // Translate PRP and SRP along the n-axis (forward)
        const translationAmount = 1; // Adjust as needed
        this.scene.view.prp.z -= translationAmount;
        this.scene.view.srp.z -= translationAmount;
        // Redraw scene after translation
        this.draw();
    }

    //
    draw() {
        console.log("Drawing scene");
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
        let perspMat = CG.mat4x4Perspective(this.scene.view.prp, this.scene.view.srp, this.scene.view.vup, this.scene.view.clip);
        let mPerMat = CG.mat4x4MPer();
        let viewportMat = CG.mat4x4Viewport(this.canvas.width, this.canvas.height);
    
        for (let i = 0; i < this.scene.models.length; i++) {
            let model = this.scene.models[i];
            let newVertices = [];
    
            for (let j = 0; j < model.vertices.length; j++) {
                let vert = model.vertices[j];
                let perspVert = Matrix.multiply([perspMat, vert]);
                let mPerVert = Matrix.multiply([mPerMat, perspVert]);
                newVertices.push(mPerVert);
            }
    
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

        // TODO: implement drawing here!
        // For each model
        //   * For each vertex
        //     * transform endpoints to canonical view volume
        //   * For each line segment in each edge
        //     * clip in 3D
        //     * project to 2D
        //     * translate/scale to viewport (i.e. window)
        //     * draw line

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
        
        // TODO: implement clipping here!
        
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

