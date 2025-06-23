import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase'; 

export const fetchProperties = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'ACN123'));
    const userData = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: data.propertyId || doc.id,
        price: Number(data.totalAskPrice), // in Lakhs
        sba: Number(data.sbua || data.plotSize), // Use sbua if available, else plotSize
        config: data.unitType, // "2 BHK", "3 BHK"
        assetType: data.assetType?.toLowerCase(),
        locationName: data.micromarket,
        latitude: data._geoloc?.lat || null,
        longitude: data._geoloc?.lng || null,

        original: data,
      };

    });

    return userData;
  } catch (err) {
    console.error('Error fetching properties:', err);
    return [];
  }
};


export const fetchRequirements = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'requirements')); // Update path if needed
    const userData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log('Fetched requirements:', userData);
    return userData;
  } catch (err) {
    console.error('Error fetching requirements:', err);
    return [];
  }
};

export const fetchPropertyById = async (id) => {
  try {
    const docRef = doc(db, 'ACN123', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.warn('No property found for ID:', id);
      return null;
    }
  } catch (err) {
    console.error('Error fetching property by ID:', err);
    return null;
  }
};