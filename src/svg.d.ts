// svg.d.ts
//
// `.svg` files are compiled to React components by SVGR (see next.config.ts,
// both the webpack and the turbopack rule), so the default export is a
// component, not a URL string. `size` is accepted because several call sites
// pass it; SVGR spreads unknown props onto the <svg> element.
declare module "*.svg" {
  import * as React from "react";
  type SvgComponent = React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string; size?: number | string }
  >;
  export const ReactComponent: SvgComponent;
  const Component: SvgComponent;
  export default Component;
}
