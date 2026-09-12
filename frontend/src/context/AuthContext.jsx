import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId, userObj = null) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (!error && data) {
        const profileWithRole = {
          ...data,
          role: data.role || 'donor'
        }
        setProfile(profileWithRole)
        return profileWithRole
      } else if (error) {
        // If profile row is missing (e.g. failed during registration before SQL migration), auto-heal it
        const currentUser = userObj || user || (await supabase.auth.getUser())?.data?.user
        if (currentUser) {
          const fallbackProfile = {
            id: currentUser.id,
            name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Community Member',
            email: currentUser.email,
            role: currentUser.user_metadata?.role || 'donor',
            city: currentUser.user_metadata?.city || 'Mumbai',
            state: currentUser.user_metadata?.state || 'Maharashtra',
            district: currentUser.user_metadata?.district || 'Mumbai City',
            location: currentUser.user_metadata?.city || 'Mumbai',
            is_verified: true,
            verification_status: 'verified',
          }
          const { data: newProfile, error: insertErr } = await supabase
            .from('profiles')
            .upsert(fallbackProfile)
            .select()
            .single()

          const resolved = (!insertErr && newProfile) ? newProfile : fallbackProfile
          setProfile(resolved)
          return resolved
        }
      }
    } catch (err) {
      console.warn('Profile fetch warning:', err)
    } finally {
      setLoading(false)
    }
    return null
  }

  async function register({ name, email, password, role, city, state, district, phone, organization_type, registration_number }) {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { name, role, city, state, district }
      }
    })
    if (error) throw error
    if (data.user) {
      const profileData = {
        id: data.user.id,
        name,
        email,
        role: role || 'donor',
        city: city || 'Mumbai',
        state: state || 'Maharashtra',
        district: district || 'Mumbai City',
        location: city || 'Mumbai',
        phone: phone || null,
        organization_type: organization_type || null,
        registration_number: registration_number || null,
        is_verified: true,
        verification_status: 'verified',
      }
      
      const { data: createdProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single()
        
      if (profileError) {
        console.error('Profile insertion error:', profileError)
      }
      const finalProfile = createdProfile || profileData
      setProfile(finalProfile)
      return { user: data.user, profile: finalProfile }
    }
    return data
  }

  async function login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data?.user) {
      setUser(data.user)
      const prof = await fetchProfile(data.user.id, data.user)
      return { session: data.session, user: data.user, profile: prof }
    }
    return data
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
