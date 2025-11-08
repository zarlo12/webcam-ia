import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  Timestamp,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export interface LEDImageData {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  imageUrl: string;
  consentimientoAceptado: string;
  date: Timestamp;
  correoEnviado: boolean;

  // Campos para sistema de pantallas
  displayOrder: number;
  currentScreen: number; // 0 = no visible, 1-3 = pantalla actual
  lastScreenUpdate: Timestamp;
  screenHistory: number[];
  status: "pending" | "displaying" | "completed";
}

class LEDScreenService {
  private collectionName = "XnovaGofestLED";
  private screenRotationInterval = 5000; // 5 segundos
  private rotationSystemStarted = false; // ✅ Bandera para evitar múltiples inicios
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Suscripción en tiempo real para una pantalla específica
   */
  subscribeToScreen(
    screenNumber: 1 | 2 | 3,
    callback: (imageData: LEDImageData | null) => void
  ) {
    const q = query(
      collection(db, this.collectionName),
      where("currentScreen", "==", screenNumber),
      where("status", "==", "displaying"),
      orderBy("lastScreenUpdate", "desc"),
      limit(1)
    );

    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }

      const doc = snapshot.docs[0];
      callback({
        id: doc.id,
        ...doc.data(),
      } as LEDImageData);
    });
  }

  /**
   * Obtener todas las imágenes pendientes de mostrar
   */
  async getPendingImages(): Promise<LEDImageData[]> {
    const q = query(
      collection(db, this.collectionName),
      where("status", "==", "pending"),
      orderBy("date", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as LEDImageData)
    );
  }

  /**
   * Mover imagen a la siguiente pantalla
   */
  async moveToNextScreen(imageId: string, currentScreen: number) {
    const docRef = doc(db, this.collectionName, imageId);

    if (currentScreen === 0) {
      // Mover a pantalla 1
      await updateDoc(docRef, {
        currentScreen: 1,
        lastScreenUpdate: Timestamp.now(),
        screenHistory: [1],
        status: "displaying",
      });
    } else if (currentScreen < 3) {
      // Mover a siguiente pantalla
      const nextScreen = currentScreen + 1;
      await updateDoc(docRef, {
        currentScreen: nextScreen,
        lastScreenUpdate: Timestamp.now(),
        screenHistory: [1, 2, 3].slice(0, nextScreen),
      });
    } else {
      // ♻️ VOLVER A LA COLA después de pantalla 3 (repetir infinitamente)
      console.log(`♻️ Imagen completada, volviendo a la cola: ${imageId}`);
      await updateDoc(docRef, {
        currentScreen: 0,
        lastScreenUpdate: Timestamp.now(),
        screenHistory: [],
        status: "pending", // ✅ Cambiado de 'completed' a 'pending' para repetir
      });
    }
  }

  /**
   * Iniciar el sistema de rotación automática
   */
  startRotationSystem() {
    // ✅ Prevenir múltiples inicios
    if (this.rotationSystemStarted) {
      console.log("⚠️ Sistema de rotación ya está en ejecución");
      return;
    }

    console.log("🎬 Sistema de rotación de pantallas LED iniciado");
    this.rotationSystemStarted = true;

    // Revisar y rotar imágenes cada 5 segundos
    this.intervalId = setInterval(async () => {
      try {
        await this.processRotation();
      } catch (error) {
        console.error("Error en rotación de pantallas:", error);
      }
    }, this.screenRotationInterval);
  }

  /**
   * Detener el sistema de rotación (útil para limpieza)
   */
  stopRotationSystem() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.rotationSystemStarted = false;
      console.log("🛑 Sistema de rotación detenido");
    }
  }

  /**
   * Procesar la rotación de imágenes
   */
  private async processRotation() {
    const now = Timestamp.now();

    // Obtener imágenes actuales en las pantallas
    const displayingQuery = query(
      collection(db, this.collectionName),
      where("status", "==", "displaying"),
      orderBy("lastScreenUpdate", "asc")
    );

    const displayingSnapshot = await getDocs(displayingQuery);

    // Rotar imágenes que han estado 5+ segundos
    for (const docSnap of displayingSnapshot.docs) {
      const data = docSnap.data() as LEDImageData;
      const timeDiff = now.seconds - data.lastScreenUpdate.seconds;

      if (timeDiff >= 5) {
        await this.moveToNextScreen(docSnap.id, data.currentScreen);
      }
    }

    // Llenar pantallas vacías con imágenes pendientes
    await this.fillEmptyScreens();
  }

  /**
   * Llenar pantallas vacías con imágenes pendientes
   */
  private async fillEmptyScreens() {
    // Verificar qué pantallas están vacías
    const screens = [1, 2, 3];

    for (const screenNum of screens) {
      const screenQuery = query(
        collection(db, this.collectionName),
        where("currentScreen", "==", screenNum),
        where("status", "==", "displaying"),
        limit(1)
      );

      const screenSnapshot = await getDocs(screenQuery);

      // Si la pantalla está vacía, asignar siguiente imagen pendiente
      if (screenSnapshot.empty) {
        const pendingQuery = query(
          collection(db, this.collectionName),
          where("status", "==", "pending"),
          orderBy("displayOrder", "asc"),
          limit(1)
        );

        const pendingSnapshot = await getDocs(pendingQuery);

        if (!pendingSnapshot.empty) {
          const pendingDoc = pendingSnapshot.docs[0];
          await this.moveToNextScreen(pendingDoc.id, 0);
          console.log(`✅ Pantalla ${screenNum} llenada con imagen pendiente`);
        } else {
          // ♻️ Si no hay pendientes, reciclar imágenes completadas
          await this.recycleCompletedImages();
        }
      }
    }
  }

  /**
   * Reciclar imágenes completadas volviéndolas a estado 'pending'
   * (solo si no hay imágenes pendientes)
   */
  private async recycleCompletedImages() {
    const completedQuery = query(
      collection(db, this.collectionName),
      where("status", "==", "completed"),
      orderBy("lastScreenUpdate", "asc"),
      limit(10)
    );

    const completedSnapshot = await getDocs(completedQuery);

    if (!completedSnapshot.empty) {
      console.log(
        `♻️ Reciclando ${completedSnapshot.size} imágenes completadas`
      );

      for (const docSnap of completedSnapshot.docs) {
        const docRef = doc(db, this.collectionName, docSnap.id);
        await updateDoc(docRef, {
          currentScreen: 0,
          lastScreenUpdate: Timestamp.now(),
          screenHistory: [],
          status: "pending",
        });
      }
    }
  }

  /**
   * Agregar nueva imagen al sistema
   */
  async addImageToQueue(imageData: Partial<LEDImageData>) {
    const docRef = collection(db, this.collectionName);

    // Obtener el último displayOrder
    const orderQuery = query(docRef, orderBy("displayOrder", "desc"), limit(1));

    const orderSnapshot = await getDocs(orderQuery);
    const nextOrder = orderSnapshot.empty
      ? 1
      : (orderSnapshot.docs[0].data().displayOrder || 0) + 1;

    const newImageData = {
      ...imageData,
      displayOrder: nextOrder,
      currentScreen: 0,
      lastScreenUpdate: Timestamp.now(),
      screenHistory: [],
      status: "pending" as const,
      date: imageData.date || Timestamp.now(),
    };

    console.log("📸 Nueva imagen agregada a la cola:", newImageData);

    return newImageData;
  }
}

export default new LEDScreenService();
