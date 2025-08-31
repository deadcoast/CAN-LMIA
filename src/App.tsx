import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import MapPage from './pages/MapPage';
import StatisticsPage from './pages/StatisticsPage';
import { useEmployerData } from './hooks/useEmployerData';

function App() {
  const { 
    filters, 
    updateFilters, 
    exportData, 
    dataSource 
  } = useEmployerData();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <Header
          searchQuery={filters.search_query}
          onSearchChange={(query) => updateFilters({ search_query: query })}
          onExportData={exportData}
          onToggleFilters={() => setShowFilters(!showFilters)}
          showFilters={showFilters}
          dataSource={dataSource}
        />

        {/* Routes */}
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;