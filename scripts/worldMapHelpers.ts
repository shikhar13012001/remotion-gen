const W = 920;
const H = 500;

/** Equirectangular projection: lon/lat → [x, y] in a W×H viewport. */
export function project(lon: number, lat: number): [number, number] {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y];
}

/** Render a GeoJSON geometry to an SVG path string. */
export function geometryToPath(geometry: GeoJSON.Geometry): string {
  if (!geometry) return "";

  function ringToD(ring: number[][]): string {
    return ring
      .map(([lon, lat], i) => {
        const [x, y] = project(lon, lat);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ") + " Z";
  }

  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(ringToD).join(" ");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap((polygon) => polygon.map(ringToD)).join(" ");
  }
  return "";
}

export const NUMERIC_TO_ALPHA3: Record<string, string> = {
  "004":"AFG","008":"ALB","012":"DZA","024":"AGO","032":"ARG","036":"AUS",
  "040":"AUT","050":"BGD","056":"BEL","064":"BTN","068":"BOL","076":"BRA",
  "100":"BGR","104":"MMR","116":"KHM","120":"CMR","124":"CAN","144":"LKA",
  "152":"CHL","156":"CHN","170":"COL","180":"COD","188":"CRI","191":"HRV",
  "192":"CUB","196":"CYP","203":"CZE","208":"DNK","214":"DOM","218":"ECU",
  "818":"EGY","222":"SLV","231":"ETH","246":"FIN","250":"FRA","276":"DEU",
  "288":"GHA","300":"GRC","320":"GTM","332":"HTI","340":"HND","348":"HUN",
  "356":"IND","360":"IDN","364":"IRN","368":"IRQ","372":"IRL","376":"ISR",
  "380":"ITA","388":"JAM","392":"JPN","400":"JOR","398":"KAZ","404":"KEN",
  "408":"PRK","410":"KOR","414":"KWT","418":"LAO","422":"LBN","434":"LBY",
  "440":"LTU","442":"LUX","458":"MYS","484":"MEX","504":"MAR","508":"MOZ",
  "516":"NAM","524":"NPL","528":"NLD","540":"NCL","554":"NZL","558":"NIC",
  "566":"NGA","578":"NOR","586":"PAK","591":"PAN","604":"PER","608":"PHL",
  "616":"POL","620":"PRT","630":"PRI","634":"QAT","642":"ROU","643":"RUS",
  "682":"SAU","686":"SEN","694":"SLE","706":"SOM","710":"ZAF","724":"ESP",
  "729":"SDN","752":"SWE","756":"CHE","760":"SYR","764":"THA","792":"TUR",
  "800":"UGA","804":"UKR","784":"ARE","826":"GBR","840":"USA","858":"URY",
  "860":"UZB","862":"VEN","704":"VNM","887":"YEM","894":"ZMB","716":"ZWE",
};
