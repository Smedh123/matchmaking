// src/App.jsx
import { useEffect } from 'react'
import { db } from './firebase'
import { collection, getDocs } from 'firebase/firestore'

function App() {
  useEffect(() => {
    const testFirebase = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'test'))
        querySnapshot.forEach((doc) => {
          console.log(doc.id, '=>', doc.data())
        })
        console.log('✅ Firebase Firestore connected')
      } catch (err) {
        console.error('❌ Firebase error:', err.message)
      }
    }

    testFirebase()
  }, [])

  return (
    <div className="p-6 text-xl font-bold text-green-600">
      Firebase Test – Check Console
    </div>
  )
}

export default App
