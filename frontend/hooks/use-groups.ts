import { useState, useCallback } from 'react'

export interface Group {
  id: string
  name: string
  purpose: string
  contributionAmount: number
  frequency: 'daily' | 'weekly' | 'monthly'
  referralCode: string
  referralLink: string
  members: GroupMember[]
  balance: number
  totalContributed: number
  createdAt: string
}

export interface GroupMember {
  id: string
  name: string
  email: string
  contributionAmount: number
  totalContributed: number
  referredBy?: string
  joinedAt?: string
}

export interface Transaction {
  id: string
  memberId: string
  memberName: string
  amount: number
  date: string
  description: string
  status: 'pending' | 'completed' | 'failed'
}

export interface UseGroupsReturn {
  groups: Group[]
  loading: boolean
  error: string | null
  createGroup: (data: {
    groupName: string
    purpose: string
    contributionAmount: string
    frequency: 'daily' | 'weekly' | 'monthly'
  }) => Promise<Group>
  joinGroup: (referralCode: string, referredBy?: string) => Promise<Group>
  contributeToGroup: (groupId: string, amount: number, description?: string) => Promise<Transaction>
  getGroupTransactions: (groupId: string) => Promise<Transaction[]>
  fetchGroups: () => Promise<void>
}

export function useGroups(): UseGroupsReturn {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/groups', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch groups')
      }

      const data = await response.json()
      if (data.success) {
        setGroups(data.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  const createGroup = useCallback(async (formData: {
    groupName: string
    purpose: string
    contributionAmount: string
    frequency: 'daily' | 'weekly' | 'monthly'
  }): Promise<Group> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create group')
      }

      const data = await response.json()
      if (data.success && data.data) {
        setGroups([...groups, data.data])
        return data.data
      }
      throw new Error('Invalid response')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [groups])

  const joinGroup = useCallback(async (referralCode: string, referredBy?: string): Promise<Group> => {
    setLoading(true)
    setError(null)
    try {
      // First, find the group with this referral code
      const groupResponse = await fetch('/api/groups', {
        method: 'GET',
        credentials: 'include',
      })

      if (!groupResponse.ok) {
        throw new Error('Failed to fetch groups')
      }

      const groupsData = await groupResponse.json()
      const targetGroup = groupsData.data.find((g: Group) => g.referralCode === referralCode)

      if (!targetGroup) {
        throw new Error('Invalid referral code')
      }

      // Then, join the group
      const response = await fetch(`/api/groups/${targetGroup.id}/join`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode, referredBy }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to join group')
      }

      const data = await response.json()
      if (data.success && data.data) {
        return data.data
      }
      throw new Error('Invalid response')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const contributeToGroup = useCallback(async (
    groupId: string,
    amount: number,
    description?: string
  ): Promise<Transaction> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/groups/${groupId}/contribute`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          description: description || 'Group contribution',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to record contribution')
      }

      const data = await response.json()
      if (data.success && data.data.transaction) {
        return data.data.transaction
      }
      throw new Error('Invalid response')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getGroupTransactions = useCallback(async (groupId: string): Promise<Transaction[]> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/groups/${groupId}/contribute`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await response.json()
      if (data.success) {
        return data.data
      }
      throw new Error('Invalid response')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    groups,
    loading,
    error,
    createGroup,
    joinGroup,
    contributeToGroup,
    getGroupTransactions,
    fetchGroups,
  }
}
