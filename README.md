# Side-by-Side Gaussian Splat Viewer

A web-based application to view 3D Gaussian Splatting (.ply) files in a side-by-side (SBS) stereo format, designed for use with AR/VR glasses like the XREAL One Pro.

## Key Features

-   **Load Your Own Splats:** Use the file input to load any `.ply` Gaussian Splat file.
-   **Side-by-Side Stereo Rendering:** Renders the 3D scene to a single canvas with two viewpoints for stereoscopic viewing.
-   **Interactive Controls:**
    -   **Orbit:** Click and drag the mouse to rotate around the scene.
    -   **Zoom:** Use the mouse scroll wheel to zoom in and out.
    -   **Recenter:** Click once to reset the view to the center.
-   **Fullscreen Mode:** Maximize the application to fill the screen for an immersive experience.

## How to Use

1.  **Open the Application:** Launch the `index.html` file in a modern web browser.
2.  **Load a File:** Click the "Choose File" button and select a `.ply` Gaussian Splat file from your computer.
3.  **View in 3D:** The splat will be rendered in a side-by-side view. If you are using AR/VR glasses, they should automatically detect the SBS format and display it in 3D.
4.  **Control the View:** Use the mouse controls (drag to orbit, scroll to zoom, click to recenter) to inspect the object from different angles.
5.  **Go Fullscreen:** Click the "Fullscreen" button to maximize the view.

## Technical Details

This application is built using `three.js` for 3D rendering and the `@sparkjsdev/spark` library to handle the Gaussian Splat data.

### Stereo Rendering

The side-by-side stereo effect is achieved using a "toe-in" camera method. Two virtual cameras are created with a slight horizontal offset, and both are pointed at the same target. This approach was chosen for its robustness and compatibility with the splat rendering library after encountering issues with more complex off-axis projection methods.

### Dependencies

The project uses an `importmap` in the `index.html` file to lock the versions of `three.js` and `@sparkjsdev/spark`. This ensures that the application remains stable and is not affected by breaking changes in future library updates.

## Development & Troubleshooting

This section documents some of the challenges faced during development and their resolutions.

-   **Library Version Conflicts:**
    -   **Problem:** `TypeError: THREE.Matrix2 is not a constructor` due to incompatible versions of `three.js` and the splat rendering library.
    -   **Resolution:** Used an `importmap` to lock `three.js` to version `0.158.0` and `@sparkjsdev/spark` to `0.1.6`, ensuring compatibility.

-   **Incorrect Module Path:**
    -   **Problem:** The application was stuck on "Loading Splat..." due to a 404 Not Found error when trying to import the splat library from a CDN.
    -   **Resolution:** Switched to the `@sparkjsdev/spark` library and updated the import URL to the correct path.

-   **CORS Errors:**
    -   **Problem:** `TypeError: Failed to fetch` when loading a `.ply` file from a different domain (e.g., `raw.githubusercontent.com`).
    -   **Resolution:** For local development, use a live server extension (like VS Code's Live Server). For deployed applications, ensure assets are hosted on a server with the correct CORS headers.

-   **Incorrect Module Specifier:**
    -   **Problem:** `TypeError: Failed to resolve module specifier "three"` because the browser didn't know where to find the `three.js` module.
    -   **Resolution:** The `importmap` solved this by mapping the bare module specifier "three" to its full CDN URL.

## References

The following resources were consulted during the development of this project:

-   [ELI5: What's the difference between spatial video...](https://www.reddit.com/r/virtualreality/comments/1amotd0/eli5_whats_the_difference_between_spatial_video/)
-   [MTBS3D Forum Discussion](https://www.mtbs3d.com/phpbb/viewtopic.php?t=26326)
-   [VITURE Academy: 3D Mode Guidelines](https://academy.viture.com/xr_glasses/3d_mode_guidelines)
-   [Steam Community Discussion](https://steamcommunity.com/app/2947590/discussions/0/4637114871638463644/)
-   [Delight VR XR Glossary](https://delight-vr.com/xr-glossary/)
-   [Splunk: AR vs. VR](https://www.splunk.com/en_us/blog/learn/ar-vr.html)
-   [Instructables: Make Your Own SBS 3D Videos](https://www.instructables.com/Make-Your-Own-SBS-3D-Videos-Video/)
-   [Reddit: Tutorial on how to create side by side 3D VR 180](https://www.reddit.com/r/OculusQuest/comments/18rjebf/tutorial_on_how_to_create_side_by_side_3d_vr_180/)
-   [Meta Community Forums: Full Screen Video](https://communityforums.atmeta.com/t5/Samsung-Gear-VR/How-to-have-an-on-line-video-fill-the-whole-view-screen-with-the/td-p/694888)
-   [Tipard: Convert 3D Blu-ray to SBS](https://www.tipard.com/blu-ray/convert-3d-blu-ray-to-sbs.html)
-   [Mo-Sys: What is the difference between AR and VR broadcasting?](https://www.mo-sys.com/news/what-is-the-difference-between-ar-and-vr-broadcasting/)
-   [iPlay SBS Player on Google Play](https://play.google.com/store/apps/details?id=com.panagola.app.iplay&hl=en_US)
-   [Photo-3D Groups.io](https://photo-3d.groups.io/g/main/topics?page=116&after=1633569239581397364)
-   [YouTube: How to make a 3D video (SBS)](https://www.youtube.com/watch?v=dtWNAaVLay8)
-   [Alpha 3D: 2D to VR](https://www.alpha3d.io/kb/metaverse/2d-to-vr/)
-   [Reddit: 3D SBS Video in Oculus](https://www.reddit.com/r/OculusQuest/comments/ltgfv9/3d_sbs_video_in_oculus_best_methods_to_stream/)
-   [YouTube: How to make 3D SBS Video](https://www.youtube.com/watch?v=n-_DHTJRuY0)
-   [Jellyfin Forum: 3D Full SBS Video Detection](https://forum.jellyfin.org/t-3d-full-sbs-video-detection-and-playback)
-   [VideoTechnology Blog: FFmpeg Stereo 3D VR180](http://videotechnology.blogspot.com/2020/07/ffmpeg-stereo-3d-vr180.html)
-   [DesktopSbS on GitHub](https://github.com/PaysPlat/DesktopSbS)
