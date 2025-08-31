import * as echarts from 'echarts';
import echartsTheme from '../components/charts/echarts_theme.json';

// Register the purple-passion theme with ECharts
export const registerPurplePassionTheme = () => {
  echarts.registerTheme('purple-passion', echartsTheme);
};

// Auto-register the theme when this module is imported
registerPurplePassionTheme();
