'use client' // บอก Next.js ว่านี่คือ Client Component

import { useEffect, useState } from 'react'
import liff from '@line/liff'
import { createClient } from '@/lib/supabaseClient'

export default function Home() {
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
        if (liff.isLoggedIn()) {
          const userProfile = await liff.getProfile()
          setProfile(userProfile)
          // เมื่อ login แล้ว ให้บันทึกข้อมูลลง Supabase
          await upsertUser(userProfile)
        }
      } catch (e: any) {
        setError(e.toString())
      }
    }
    initializeLiff()
  }, [])

  const handleLogin = async () => {
    try {
      if (!liff.isLoggedIn()) {
        liff.login()
      }
    } catch (e: any) {
      setError(e.toString())
    }
  }

  const handleLogout = () => {
    liff.logout()
    window.location.reload()
  }

  // ฟังก์ชันสำหรับเพิ่มหรืออัปเดตข้อมูลผู้ใช้ใน Supabase
  const upsertUser = async (userProfile: any) => {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        line_user_id: userProfile.userId,
        full_name: userProfile.displayName,
        avatar_url: userProfile.pictureUrl,
      }, { onConflict: 'line_user_id' }) // ถ้ามี line_user_id อยู่แล้วให้อัปเดต
      .select()

    if (error) {
      console.error('Error upserting user:', error)
    } else {
      console.log('User upserted successfully:', data)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          Glovetex Badminton
        </h1>
        {error && <p className="text-red-500">Error: {error}</p>}
        
        {profile ? (
          <div>
            <h2 className="text-xl mb-2">Welcome, {profile.displayName}!</h2>
            <img
              src={profile.pictureUrl}
              alt="Profile"
              width={100}
              height={100}
              className="rounded-full mx-auto mb-4"
            />
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-4">Please log in to continue.</p>
            <button
              onClick={handleLogin}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Login with LINE
            </button>
          </div>
        )}
      </div>
    </main>
  )
}