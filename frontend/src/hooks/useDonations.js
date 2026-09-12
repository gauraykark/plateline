import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useDonations({ role, userId, autoFetch = true } = {}) {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase.from('donations').select('*').order('created_at', { ascending: false })

      if (role === 'donor' && userId) {
        query = query.eq('donor_id', userId)
      } else if (role === 'ngo' && userId) {
        // NGOs want to see both pending (available) and those they accepted
        // In listings they filter pending, in tracking they filter their accepted ones
      }

      const { data, error: fetchErr } = await query
      if (fetchErr) throw fetchErr
      setDonations(data || [])
      setError(null)
    } catch (err) {
      console.error('Error loading donations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [role, userId])

  useEffect(() => {
    if (!autoFetch) return
    fetchDonations()

    const channelName = `donations_rt_${Math.random().toString(36).slice(2, 7)}`
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setDonations(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setDonations(prev => prev.map(d => d.id === payload.new.id ? { ...d, ...payload.new } : d))
        } else if (payload.eventType === 'DELETE') {
          setDonations(prev => prev.filter(d => d.id === payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [autoFetch, fetchDonations])

  // Helper to upload food photo
  const uploadPhoto = async (file, currentUserId = 'user') => {
    if (!file) return null
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUserId}-${Date.now()}.${fileExt}`

      let res = await supabase.storage
        .from('food-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (res.error) {
        res = await supabase.storage
          .from('donation-photos')
          .upload(`donation-images/${fileName}`, file, { cacheControl: '3600', upsert: false })
      }

      if (!res.error) {
        const bucket = res.data?.fullPath?.split('/')?.[0] || 'food-photos'
        const { data } = supabase.storage.from(bucket).getPublicUrl(res.data?.path || fileName)
        return data?.publicUrl || null
      }
      return null
    } catch (err) {
      console.warn('Photo upload failed:', err)
      return null
    }
  }

  // Create new food donation
  const createDonation = async (formData, photoFile) => {
    try {
      let imageUrl = null
      if (photoFile) {
        imageUrl = await uploadPhoto(photoFile)
      }

      const { data, error: insertError } = await supabase.from('donations').insert({
        ...formData,
        image_url: imageUrl,
        status: 'pending',
      }).select().single()

      if (insertError) throw insertError
      toast.success('Food donation posted successfully!')
      return data
    } catch (err) {
      toast.error(err.message || 'Failed to post donation')
      throw err
    }
  }

  // Accept donation (generates 6-digit OTP)
  const acceptDonation = async (donationId, ngoProfile) => {
    try {
      if (!donationId) throw new Error('Donation ID is required')
      if (!ngoProfile?.id) throw new Error('NGO profile is required to claim a donation')

      // Generate 6-digit handover OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString()

      const { data, error } = await supabase
        .from('donations')
        .update({
          status: 'accepted',
          accepted_by: ngoProfile.id,
          accepted_at: new Date().toISOString(),
          pickup_otp: otp
        })
        .eq('id', donationId)
        .select()

      if (error) {
        console.error('Supabase error claiming donation:', error)
        toast.error(error.message || 'Failed to claim donation')
        throw error
      }

      if (!data || data.length === 0) {
        const rlsMsg = 'Permission denied by Supabase RLS. Please run the SQL policy update in Supabase SQL Editor.'
        toast.error(rlsMsg)
        throw new Error(rlsMsg)
      }

      const updatedRow = data[0]

      // Immediately refresh the local donations state so the claimed item disappears from available listings
      setDonations(prev => prev.map(d => d.id === donationId ? { ...d, ...updatedRow } : d))

      // Non-blocking in-app notification to donor
      if (updatedRow?.donor_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: updatedRow.donor_id,
            title: 'Donation Accepted!',
            message: `${ngoProfile.name || 'An NGO Partner'} has accepted your donation for "${updatedRow.food_name}". Your pickup OTP is ${otp}. Please provide this to the driver upon pickup.`,
            type: 'success',
            link_tab: 'donations',
          })
        } catch (notifErr) {
          console.warn('Non-blocking notification notice:', notifErr)
        }
      }

      toast.success('Donation claimed! Pickup OTP generated.')
      return updatedRow
    } catch (err) {
      console.error('Error in acceptDonation:', err)
      if (!err.message?.includes('Failed to claim donation')) {
        toast.error(err.message || 'Failed to claim donation')
      }
      throw err
    }
  }

  // Verify Handover OTP when picking up food
  const verifyAndCollect = async (donationId, enteredOtp, targetDonation) => {
    try {
      if (targetDonation.pickup_otp && enteredOtp.trim() !== targetDonation.pickup_otp) {
        throw new Error('Invalid verification OTP. Please ask the donor for the 6-digit handover code.')
      }

      const { data, error: updateError } = await supabase.from('donations').update({
        status: 'collected',
        collected_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
      }).eq('id', donationId).select().single()

      if (updateError) throw updateError

      // Notify donor of successful handover
      if (data?.donor_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: data.donor_id,
            title: 'Food Handover Verified',
            message: `Your donation for "${data.food_name}" has been securely verified and picked up.`,
            type: 'success',
            link_tab: 'tracking',
          })
        } catch (notifErr) {
          console.warn('Non-blocking notification notice:', notifErr)
        }
      }

      toast.success('OTP verified! Handover marked as collected.')
      return data
    } catch (err) {
      toast.error(err.message || 'Verification failed')
      throw err
    }
  }

  // Update status (in-transit, delivered)
  const updateDonationStatus = async (donationId, newStatus, donorId, foodName, podFile = null) => {
    try {
      const updates = { status: newStatus }
      if (newStatus === 'in-transit') updates.in_transit_at = new Date().toISOString()
      if (newStatus === 'delivered' || newStatus === 'completed') {
        updates.delivered_at = new Date().toISOString()
        if (podFile) {
          const proofUrl = await uploadPhoto(podFile)
          if (proofUrl) updates.proof_image_url = proofUrl
        }
      }

      const { data, error: updateError } = await supabase.from('donations')
        .update(updates)
        .eq('id', donationId)
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state immediately
      setDonations(prev => prev.map(d => d.id === donationId ? { ...d, ...data } : d))

      // Notify donor
      if (donorId) {
        const title = newStatus === 'in-transit' ? 'Donation In Transit' : 'Donation Successfully Delivered!'
        const message = newStatus === 'in-transit' 
          ? `Your donation "${foodName}" is on its way to the community shelter.` 
          : `Your donation "${foodName}" was safely delivered and distributed.`
        try {
          await supabase.from('notifications').insert({
            user_id: donorId,
            title,
            message,
            type: newStatus === 'in-transit' ? 'info' : 'success',
            link_tab: 'tracking',
          })
        } catch (notifErr) {
          console.warn('Non-blocking notification notice:', notifErr)
        }
      }

      toast.success(`Status updated to ${newStatus.replace('-', ' ')}`)
      return data
    } catch (err) {
      console.error('Failed to update status:', err)
      toast.error(err.message || 'Failed to update status')
      throw err
    }
  }

  return {
    donations,
    loading,
    error,
    refreshDonations: fetchDonations,
    createDonation,
    acceptDonation,
    verifyAndCollect,
    updateDonationStatus,
  }
}
