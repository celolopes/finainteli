declare module "victory-native" {
  // Legacy Victory Native exports (pre-Skia)
  export const VictoryBar: any;
  export const VictoryChart: any;
  export const VictoryTheme: any;
  export const VictoryAxis: any;
  export const VictoryPie: any;
  export const VictoryLine: any;
  export const VictoryLabel: any;

  // Skia-based Victory Native exports (v41+)
  export const CartesianChart: any;
  export const Line: any;
  export const Bar: any;
  export const Pie: any;
  export const PolarChart: any;
}
