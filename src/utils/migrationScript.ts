import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Script para duplicar la colección XnovaGofest a XnovaGofestLED
 * con la nueva estructura para el sistema de pantallas LED
 */
export async function migrateToLEDCollection() {
  console.log("🚀 Iniciando migración de datos...");

  try {
    // Leer todos los documentos de la colección original
    const originalCollection = collection(db, "XnovaGofest");
    const snapshot = await getDocs(originalCollection);

    console.log(`📊 Documentos encontrados: ${snapshot.size}`);

    if (snapshot.empty) {
      console.log("⚠️ No hay documentos para migrar");
      return;
    }

    // Colección destino
    const newCollection = collection(db, "XnovaGofestLED");

    let migratedCount = 0;
    let displayOrder = 1;

    // Migrar cada documento con la nueva estructura
    for (const doc of snapshot.docs) {
      const originalData = doc.data();

      const newData = {
        // Campos originales
        nombre: originalData.nombre || "",
        email: originalData.email || "",
        telefono: originalData.telefono || "",
        empresa: originalData.empresa || "",
        imageUrl: originalData.imageUrl || "",
        consentimientoAceptado: originalData.consentimientoAceptado || "Sí",
        date: originalData.date || Timestamp.now(),
        correoEnviado: originalData.correoEnviado || false,

        // Nuevos campos para el sistema LED
        displayOrder: displayOrder++,
        currentScreen: 0, // 0 = pendiente, 1-3 = en pantalla
        lastScreenUpdate: Timestamp.now(),
        screenHistory: [],
        status: "pending" as const,
      };

      await addDoc(newCollection, newData);
      migratedCount++;

      console.log(
        `✅ Migrado: ${originalData.nombre} (${migratedCount}/${snapshot.size})`
      );
    }

    console.log(`🎉 Migración completada: ${migratedCount} documentos`);
    console.log("📝 Nueva colección: XnovaGofestLED");

    return {
      success: true,
      migratedCount,
      totalDocuments: snapshot.size,
    };
  } catch (error) {
    console.error("❌ Error en la migración:", error);
    throw error;
  }
}

/**
 * Crear documentos de prueba en la colección LED
 */
export async function createTestData() {
  console.log("🧪 Creando datos de prueba...");

  const testCollection = collection(db, "XnovaGofestLED");

  const testImages = [
    {
      nombre: "Juan Pérez",
      email: "juan.perez@test.com",
      telefono: "3001234567",
      empresa: "Tech Corp",
      imageUrl:
        "https://via.placeholder.com/400x600/FF0080/FFFFFF?text=Imagen+1",
      consentimientoAceptado: "Sí",
      date: Timestamp.now(),
      correoEnviado: true,
      displayOrder: 1,
      currentScreen: 0,
      lastScreenUpdate: Timestamp.now(),
      screenHistory: [],
      status: "pending" as const,
    },
    {
      nombre: "María García",
      email: "maria.garcia@test.com",
      telefono: "3009876543",
      empresa: "Design Studio",
      imageUrl:
        "https://via.placeholder.com/400x600/00D4FF/FFFFFF?text=Imagen+2",
      consentimientoAceptado: "Sí",
      date: Timestamp.now(),
      correoEnviado: true,
      displayOrder: 2,
      currentScreen: 0,
      lastScreenUpdate: Timestamp.now(),
      screenHistory: [],
      status: "pending" as const,
    },
    {
      nombre: "Carlos Rodríguez",
      email: "carlos.rodriguez@test.com",
      telefono: "3015551234",
      empresa: "Innovation Labs",
      imageUrl:
        "https://via.placeholder.com/400x600/FFD700/000000?text=Imagen+3",
      consentimientoAceptado: "Sí",
      date: Timestamp.now(),
      correoEnviado: true,
      displayOrder: 3,
      currentScreen: 0,
      lastScreenUpdate: Timestamp.now(),
      screenHistory: [],
      status: "pending" as const,
    },
  ];

  for (const testData of testImages) {
    await addDoc(testCollection, testData);
    console.log(`✅ Creado: ${testData.nombre}`);
  }

  console.log("🎉 Datos de prueba creados exitosamente");
}

export default {
  migrateToLEDCollection,
  createTestData,
};
