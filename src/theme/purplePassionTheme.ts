// Purple Passion Theme Configuration
// Extracted from ECharts theme and adapted for UI components

export const purplePassionTheme = {
  // Primary color palette from ECharts theme
  colors: {
    primary: '#c6cf6b',      // Light green
    secondary: '#d66b81',    // Pink
    accent: '#7d87e3',       // Blue
    purple: '#71669e',       // Purple
    magenta: '#cc70af',      // Magenta
    cyan: '#7cb4cc',         // Cyan
    lightPurple: '#e098c7',  // Light purple
    lightBlue: '#8fd3e8',    // Light blue
    darkPurple: '#8a7ca8',   // Dark purple
  },
  
  // Background colors
  backgrounds: {
    primary: 'rgba(91,92,110,1)',     // Dark purple-gray
    secondary: 'rgba(91,92,110,0.8)', // Semi-transparent
    card: 'rgba(91,92,110,0.9)',      // Card background
    surface: 'rgba(91,92,110,0.7)',   // Surface background
  },
  
  // Text colors
  text: {
    primary: '#ffffff',      // White
    secondary: '#cccccc',    // Light gray
    muted: '#aaaaaa',        // Muted gray
    dark: '#333333',         // Dark gray
  },
  
  // Border colors
  borders: {
    primary: '#cccccc',      // Light gray
    secondary: '#444444',    // Dark gray
    accent: '#e098c7',       // Light purple
  },
  
  // Gradient configurations
  gradients: {
    primary: 'linear-gradient(135deg, #c6cf6b 0%, #d66b81 100%)',
    secondary: 'linear-gradient(135deg, #7d87e3 0%, #71669e 100%)',
    accent: 'linear-gradient(135deg, #cc70af 0%, #7cb4cc 100%)',
    dark: 'linear-gradient(135deg, #71669e 0%, #8a7ca8 100%)',
  },
  
  // Chart-specific colors (matching ECharts theme)
  chartColors: [
    '#c6cf6b',
    '#d66b81', 
    '#7d87e3',
    '#71669e',
    '#cc70af',
    '#7cb4cc'
  ],
  
  // Visual map colors
  visualMapColors: [
    '#8a7ca8',
    '#e098c7', 
    '#cceffa'
  ]
};

// ECharts theme configuration
export const echartsThemeConfig = {
  color: purplePassionTheme.chartColors,
  backgroundColor: purplePassionTheme.backgrounds.primary,
  textStyle: {
    color: purplePassionTheme.text.primary
  },
  title: {
    textStyle: {
      color: purplePassionTheme.text.primary
    },
    subtextStyle: {
      color: purplePassionTheme.text.secondary
    }
  },
  legend: {
    textStyle: {
      color: purplePassionTheme.text.secondary
    }
  },
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    textStyle: {
      color: purplePassionTheme.text.primary
    }
  }
};
