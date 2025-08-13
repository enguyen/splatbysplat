import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let splatMesh;

async function init() {
    console.log("init started");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 3);

    const canvas = document.getElementById('splat-canvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const fileInput = document.getElementById('splat-file');
    fileInput.addEventListener('change', loadSplatFile, false);

    const fullscreenBtn = document.getElementById('fullscreen-btn');
    fullscreenBtn.addEventListener('click', toggleFullscreen, false);

    window.addEventListener('resize', onWindowResize, false);

    animate();
    console.log("init finished");
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (splatMesh) {
        splatMesh.material.uniforms.renderSize.value.set(renderer.domElement.width, renderer.domElement.height);
    }
}

class PlyParser {
    constructor(buffer) {
        this.buffer = buffer;
        this.header = '';
        this.elements = [];
    }

    async parseHeader() {
        console.log("PlyParser: parsing header...");
        const textDecoder = new TextDecoder();
        let headerOffset = 0;
        const end_header = "end_header\n";

        while (true) {
            const chunk = this.buffer.slice(headerOffset, headerOffset + 256);
            const text = textDecoder.decode(chunk, {stream: true});
            const endHeaderIndex = text.indexOf(end_header);
            if (endHeaderIndex !== -1) {
                this.header += text.substring(0, endHeaderIndex + end_header.length);
                headerOffset += new TextEncoder().encode(text.substring(0, endHeaderIndex + end_header.length)).byteLength;
                break;
            }
            this.header += text;
            headerOffset += chunk.byteLength;
            if (headerOffset >= this.buffer.byteLength) {
                throw new Error("PLY header not found");
            }
        }

        console.log("PlyParser: header text:", this.header);
        const headerLines = this.header.split('\n');
        let currentElement;
        for (const line of headerLines) {
            const parts = line.split(' ');
            if (parts[0] === 'element') {
                currentElement = {
                    name: parts[1],
                    count: parseInt(parts[2]),
                    properties: []
                };
                this.elements.push(currentElement);
            } else if (parts[0] === 'property') {
                if(currentElement) {
                    currentElement.properties.push({
                        type: parts[1],
                        name: parts[2]
                    });
                }
            }
        }
        console.log("PlyParser: parsed elements:", this.elements);
        this.dataOffset = new TextEncoder().encode(this.header).byteLength;
        // The spec says there should be a newline after the header, but some files might not have it.
        // Let's be lenient.
        if (this.header.endsWith("\r\n")) {
            this.dataOffset -= 2;
        } else if (this.header.endsWith("\n")) {
            this.dataOffset -= 1;
        }
    }

    parseData() {
        console.log("PlyParser: parsing data...");
        const dataView = new DataView(this.buffer, this.dataOffset);
        const vertexElement = this.elements.find(e => e.name === 'vertex');
        if (!vertexElement) {
            throw new Error("No vertex element found in PLY file");
        }

        const splatCount = vertexElement.count;
        const positions = new Float32Array(splatCount * 3);
        const colors = new Float32Array(splatCount * 3);
        const opacities = new Float32Array(splatCount);
        const scales = new Float32Array(splatCount * 3);
        const rotations = new Float32Array(splatCount * 4);

        const SH_C0 = 0.28209479177387814;

        let offset = 0;
        for (let i = 0; i < splatCount; i++) {
            let quatW = 1.0, quatX = 0, quatY = 0, quatZ = 0;
            let scaleX = 1.0, scaleY = 1.0, scaleZ = 1.0;

            for (const prop of vertexElement.properties) {
                let value;
                const type = prop.type;
                if (type === 'float') {
                    value = dataView.getFloat32(offset, true);
                } else if (type === 'uchar') {
                    value = dataView.getUint8(offset) / 255.0;
                } else if (type === 'int') {
                    value = dataView.getInt32(offset, true);
                } else if (type === 'uint') {
                    value = dataView.getUint32(offset, true);
                } else if (type === 'short') {
                    value = dataView.getInt16(offset, true);
                } else if (type === 'ushort') {
                    value = dataView.getUint16(offset, true);
                } else if (type === 'char') {
                    value = dataView.getInt8(offset);
                } else {
                    throw new Error(`Unsupported PLY type: ${type}`);
                }
                offset += this.getTypeSize(type);

                switch (prop.name) {
                    case 'x': positions[i * 3 + 0] = value; break;
                    case 'y': positions[i * 3 + 1] = value; break;
                    case 'z': positions[i * 3 + 2] = value; break;
                    case 'f_dc_0': colors[i * 3 + 0] = value * SH_C0 + 0.5; break;
                    case 'f_dc_1': colors[i * 3 + 1] = value * SH_C0 + 0.5; break;
                    case 'f_dc_2': colors[i * 3 + 2] = value * SH_C0 + 0.5; break;
                    case 'opacity': opacities[i] = 1 / (1 + Math.exp(-value)); break;
                    case 'scale_0': scaleX = Math.exp(value); break;
                    case 'scale_1': scaleY = Math.exp(value); break;
                    case 'scale_2': scaleZ = Math.exp(value); break;
                    case 'rot_0': quatW = value; break;
                    case 'rot_1': quatX = value; break;
                    case 'rot_2': quatY = value; break;
                    case 'rot_3': quatZ = value; break;
                }
            }
            scales[i * 3 + 0] = scaleX;
            scales[i * 3 + 1] = scaleY;
            scales[i * 3 + 2] = scaleZ;

            const norm = Math.sqrt(quatW * quatW + quatX * quatX + quatY * quatY + quatZ * quatZ);
            rotations[i * 4 + 0] = quatW / norm;
            rotations[i * 4 + 1] = quatX / norm;
            rotations[i * 4 + 2] = quatY / norm;
            rotations[i * 4 + 3] = quatZ / norm;
        }

        console.log("PlyParser: data parsing finished.");
        return { positions, colors, opacities, scales, rotations, splatCount };
    }

    getTypeSize(type) {
        switch (type) {
            case 'float': return 4;
            case 'int': return 4;
            case 'uint': return 4;
            case 'short': return 2;
            case 'ushort': return 2;
            case 'char': return 1;
            case 'uchar': return 1;
            default: throw new Error(`Unsupported PLY type: ${type}`);
        }
    }
}

async function loadSplatFile(event) {
    console.log("loadSplatFile started");
    const file = event.target.files[0];
    if (!file) return;

    const loadingMsg = document.getElementById('loading-msg');
    loadingMsg.innerText = 'Loading Splat...';
    loadingMsg.style.display = 'block';

    try {
        const buffer = await file.arrayBuffer();
        console.log("File loaded, size:", buffer.byteLength);
        const parser = new PlyParser(buffer);
        await parser.parseHeader();
        const splatData = parser.parseData();

        if (splatMesh) {
            scene.remove(splatMesh);
            splatMesh.geometry.dispose();
            splatMesh.material.dispose();
        }

        console.log("Creating geometry...");
        const instancedGeometry = new THREE.InstancedBufferGeometry();
        instancedGeometry.setAttribute('quad_position', new THREE.BufferAttribute(new Float32Array([
            -1.0, -1.0, 0.0,
             1.0, -1.0, 0.0,
             1.0,  1.0, 0.0,
            -1.0,  1.0, 0.0
        ]), 3));
        instancedGeometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 1, 2, 0, 2, 3]), 1));

        instancedGeometry.setAttribute('a_splatPosition', new THREE.InstancedBufferAttribute(splatData.positions, 3));
        instancedGeometry.setAttribute('a_splatColor', new THREE.InstancedBufferAttribute(splatData.colors, 3));
        instancedGeometry.setAttribute('a_splatOpacity', new THREE.InstancedBufferAttribute(splatData.opacities, 1));
        instancedGeometry.setAttribute('a_splatScale', new THREE.InstancedBufferAttribute(splatData.scales, 3));
        instancedGeometry.setAttribute('a_splatRotation', new THREE.InstancedBufferAttribute(splatData.rotations, 4));
        console.log("Geometry created.");

        console.log("Loading shaders...");
        const shaderLoader = new THREE.FileLoader();
        const vertexShader = await shaderLoader.loadAsync('splat-vertex-shader.glsl');
        const fragmentShader = await shaderLoader.loadAsync('splat-fragment-shader.glsl');
        console.log("Shaders loaded.");

        console.log("Creating material...");
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                renderSize: { value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height) }
            },
            depthWrite: false,
            transparent: true,
            blending: THREE.NormalBlending
        });
        console.log("Material created.");

        splatMesh = new THREE.Mesh(instancedGeometry, material);
        scene.add(splatMesh);
        console.log("Splat mesh added to scene.");

    } catch (e) {
        console.error("Error loading splat file:", e);
        loadingMsg.innerText = 'Error loading file.';
    } finally {
        if (loadingMsg.innerText !== 'Error loading file.') {
            loadingMsg.style.display = 'none';
        }
    }
}

function toggleFullscreen() {
    const canvas = document.getElementById('splat-canvas');
    if (!document.fullscreenElement) {
        canvas.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

init();
