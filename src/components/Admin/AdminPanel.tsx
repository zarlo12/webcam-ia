import React, { useState } from 'react';
import { migrateToLEDCollection, createTestData } from '../../utils/migrationScript';
import './AdminPanel.scss';

const AdminPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMigration = async () => {
    if (!confirm('¿Estás seguro de duplicar la colección XnovaGofest a XnovaGofestLED?')) {
      return;
    }

    setIsLoading(true);
    setMessage('Migrando datos...');

    try {
      const result = await migrateToLEDCollection();
      if (result) {
        setMessage(`✅ Migración exitosa: ${result.migratedCount} documentos copiados`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTestData = async () => {
    if (!confirm('¿Crear datos de prueba en XnovaGofestLED?')) {
      return;
    }

    setIsLoading(true);
    setMessage('Creando datos de prueba...');

    try {
      await createTestData();
      setMessage('✅ Datos de prueba creados exitosamente');
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <h1>🔧 Panel de Administración LED</h1>
        
        <div className="admin-section">
          <h2>Migración de Datos</h2>
          <p>Duplica la colección <code>XnovaGofest</code> a <code>XnovaGofestLED</code></p>
          
          <button 
            onClick={handleMigration}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Migrando...' : 'Migrar Colección'}
          </button>
        </div>

        <div className="admin-section">
          <h2>Datos de Prueba</h2>
          <p>Crear 3 registros de prueba en <code>XnovaGofestLED</code></p>
          
          <button 
            onClick={handleCreateTestData}
            disabled={isLoading}
            className="btn-secondary"
          >
            {isLoading ? 'Creando...' : 'Crear Datos de Prueba'}
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="admin-info">
          <h3>📋 Estructura de la nueva colección:</h3>
          <pre>{`{
  // Campos originales
  nombre: string,
  email: string,
  telefono: string,
  empresa: string,
  imageUrl: string,
  consentimientoAceptado: string,
  date: timestamp,
  correoEnviado: boolean,
  
  // Nuevos campos para LED
  displayOrder: number,
  currentScreen: 0-3,
  lastScreenUpdate: timestamp,
  screenHistory: number[],
  status: 'pending' | 'displaying' | 'completed'
}`}</pre>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
