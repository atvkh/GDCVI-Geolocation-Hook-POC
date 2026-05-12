// utils/glassFilters.js

export const glassFilters = `
<svg style="position: absolute; width: 0; height: 0;" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 液态玻璃变形效果 -->
    <filter id="glassDistortion" x="-50%" y="-50%" width="200%" height="200%">
      <feTurbulence baseFrequency="0.02" numOctaves="3" result="turbulence"/>
      <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="6" result="displacement"/>
      <feGaussianBlur in="displacement" stdDeviation="3" result="blur"/>
      <feColorMatrix in="blur" type="matrix" 
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.9 0"/>
      <feOffset in="blur" dx="0" dy="6" result="shadow"/>
      <feMerge>
        <feMergeNode in="shadow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- 液态导航栏效果 -->
    <filter id="liquidNavbar" x="-50%" y="-50%" width="200%" height="200%">
      <feTurbulence baseFrequency="0.01" numOctaves="2" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" result="distort"/>
      <feGaussianBlur in="distort" stdDeviation="1.5" result="blur"/>
      <feColorMatrix in="blur" type="matrix" 
        values="1.05 0 0 0 0  0 1.05 0 0 0  0 0 1.1 0 0  0 0 0 0.95 0"/>
      <feOffset in="blur" dx="0" dy="3" result="shadow"/>
      <feMerge>
        <feMergeNode in="shadow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- 磨砂玻璃效果 -->
    <filter id="frostedGlass" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer in="noise" result="morenoise">
        <feFuncA type="discrete" tableValues="0.08 0.12 0.16 0.2 0.24"/>
      </feComponentTransfer>
      <feComposite in="SourceGraphic" in2="morenoise" operator="over" result="composite"/>
      <feGaussianBlur in="composite" stdDeviation="1" result="blur"/>
      <feOffset in="blur" dx="0" dy="1.5" result="offset"/>
      <feMerge>
        <feMergeNode in="offset"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- 基础玻璃效果 -->
    <filter id="glassBase" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur"/>
      <feColorMatrix in="blur" type="matrix" 
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.85 0"/>
      <feOffset in="blur" dx="0" dy="3" result="shadow"/>
      <feMerge>
        <feMergeNode in="shadow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- 卡片玻璃效果 -->
    <filter id="cardGlass" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="cardBlur"/>
      <feColorMatrix in="cardBlur" type="matrix" 
        values="1.03 0 0 0 0  0 1.03 0 0 0  0 0 1.06 0 0  0 0 0 0.82 0"/>
      <feOffset in="cardBlur" dx="0" dy="4" result="cardShadow"/>
      <feMerge>
        <feMergeNode in="cardShadow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- 发光效果 -->
    <filter id="glowEffect" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="coloredBlur"/>
      <feColorMatrix in="coloredBlur" type="matrix" 
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- 闪烁效果 -->
    <filter id="shimmerEffect" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="shimmerBlur"/>
      <feColorMatrix in="shimmerBlur" type="matrix" 
        values="1.15 0 0 0 0  0 1.15 0 0 0  0 0 1.2 0 0  0 0 0 0.75 0"/>
      <feOffset in="shimmerBlur" dx="0" dy="0.8" result="shimmerOffset"/>
      <feMerge>
        <feMergeNode in="shimmerOffset"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
</svg>
`;

export function injectGlassFilters() {
  if (typeof window !== 'undefined' && !document.querySelector('#phantom-glass-filters')) {
    const container = document.createElement('div');
    container.id = 'phantom-glass-filters';
    container.innerHTML = glassFilters;
    document.body.appendChild(container);
  }
}
