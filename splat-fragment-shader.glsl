precision highp float;

in vec4 vRgba;
in vec2 vUv;

layout(location = 0) out vec4 fragColor;

void main() {
    float dist = dot(vUv, vUv);
    if (dist > 1.0) {
        discard;
    }

    float alpha = vRgba.a * exp(-0.5 * dist * dist);
    if (alpha < 1.0/255.0) {
        discard;
    }

    fragColor = vec4(vRgba.rgb, alpha);
}
