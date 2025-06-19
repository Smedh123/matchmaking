import { useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const Users = () => {
  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'ACN123'));
        const userData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Fetched users:', userData);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchCollection();
  }, []);

  return null; // No UI
};

export default Users;