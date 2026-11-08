// Browser tests measure layout (44 px targets, overflow, the confirm bar in
// reach), so they must render with the real stylesheet. In the app it comes
// from BaseLayout.astro, which these tests never render.
import '../src/styles/global.css';
