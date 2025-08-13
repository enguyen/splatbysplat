precision highp float;

in vec3 splatPosition;
in vec3 splatColor;
in float splatOpacity;
in vec3 splatScale;
in vec4 splatRotation;
in vec2 position; // Quad vertex position

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform vec2 renderSize;

out vec4 vRgba;
out vec2 vUv;

void main() {
    vec4 viewCenter = modelViewMatrix * vec4(splatPosition, 1.0);

    // Sanity check
    if (viewCenter.z > -0.1) {
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0); // Cull behind camera
        return;
    }

    // 3D covariance matrix
    mat3 R = mat3(
        1.0 - 2.0 * (splatRotation.y * splatRotation.y + splatRotation.z * splatRotation.z),
        2.0 * (splatRotation.x * splatRotation.y + splatRotation.w * splatRotation.z),
        2.0 * (splatRotation.x * splatRotation.z - splatRotation.w * splatRotation.y),
        2.0 * (splatRotation.x * splatRotation.y - splatRotation.w * splatRotation.z),
        1.0 - 2.0 * (splatRotation.x * splatRotation.x + splatRotation.z * splatRotation.z),
        2.0 * (splatRotation.y * splatRotation.z + splatRotation.w * splatRotation.x),
        2.0 * (splatRotation.x * splatRotation.z + splatRotation.w * splatRotation.y),
        2.0 * (splatRotation.y * splatRotation.z - splatRotation.w * splatRotation.x),
        1.0 - 2.0 * (splatRotation.x * splatRotation.x + splatRotation.y * splatRotation.y)
    );

    mat3 S = mat3(
        splatScale.x, 0.0, 0.0,
        0.0, splatScale.y, 0.0,
        0.0, 0.0, splatScale.z
    );

    mat3 M = R * S;
    mat3 V = M * transpose(M);

    // Project 3D covariance to 2D
    float focal_x = projectionMatrix[0][0];
    float focal_y = projectionMatrix[1][1];
    mat3 J = mat3(
        focal_x / viewCenter.z, 0.0, -(focal_x * viewCenter.x) / (viewCenter.z * viewCenter.z),
        0.0, focal_y / viewCenter.z, -(focal_y * viewCenter.y) / (viewCenter.z * viewCenter.z),
        0.0, 0.0, 0.0
    );

    mat3 T = mat3(modelViewMatrix);
    mat3 cov2d = transpose(J) * T * V * transpose(T) * J;

    // Eigen decomposition of 2D covariance matrix
    float a = cov2d[0][0] + 0.3;
    float b = cov2d[0][1];
    float c = cov2d[1][1] + 0.3;
    float d = sqrt(max(0.0, (a - c) * (a - c) + 4.0 * b * b));
    float lambda1 = (a + c + d) / 2.0;
    float lambda2 = (a + c - d) / 2.0;

    if (lambda2 < 0.0) return;

    vec2 v1 = normalize(vec2(b, lambda1 - a));
    vec2 v2 = vec2(v1.y, -v1.x);

    // Calculate splat radius and orientation in screen space
    float radius1 = sqrt(lambda1);
    float radius2 = sqrt(lambda2);
    vec2 majorAxis = v1 * radius1;
    vec2 minorAxis = v2 * radius2;

    vUv = position;

    vec4 clipCenter = projectionMatrix * viewCenter;
    vec2 ndcCenter = clipCenter.xy / clipCenter.w;

    vec2 pos_offset = majorAxis * position.x + minorAxis * position.y;
    vec2 ndc_offset = pos_offset * 2.0 / renderSize;

    gl_Position = vec4(ndcCenter + ndc_offset, clipCenter.z / clipCenter.w, 1.0);
    vRgba = vec4(splatColor, splatOpacity);
}
