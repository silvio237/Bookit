'use client'

import Wrapper from '@/app/components/Wrapper'
import Notification from '@/app/components/Notification'
import React, { useEffect, useRef, useState } from 'react'
import FileUpload from '@/app/components/FileUpload'
import { useEdgeStore } from '@/lib/edgestore'
import { Trash2, Users } from 'lucide-react'
import Image from 'next/image'

type Props = {
  companyId: string
}

export default function RoomManager({ companyId }: Props) {
  const { edgestore } = useEdgeStore()

  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [description, setDescription] = useState('')
  const [progress, setProgress] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [rooms, setRooms] = useState<any[]>([])
  const [companyName, setCompanyName] = useState('')
  const [notification, setNotification] = useState<string>('')

  const closeNotification = () => setNotification('')

  const handleFileChange = (selectedFile: File | null) => setFile(selectedFile)

  const fetchRooms = async () => {
    try {
      const response = await fetch(`/api/rooms?companyId=${companyId}`)
      if (!response.ok) throw new Error('Erreur lors de la récupération des salles')
      const data = await response.json()
      setRooms(data.rooms)
      setCompanyName(data.companyName)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!name || !capacity || !description) {
      setNotification('Tous les champs sont obligatoires')
      return
    }

    try {
      const apiResponse = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_DATA',
          name,
          capacity: Number(capacity),
          description,
          companyId,
          imageUrl: '',
        }),
      })

      const result = await apiResponse.json()

      if (!apiResponse.ok || !result.roomId) {
        setNotification(`Erreur : ${result.message || 'Création échouée'}`)
        console.log(result)
        return
      }

      const roomId = result.roomId
      let imageUrl = ''

      if (file) {
        const res = await edgestore.publicFiles.upload({
          file,
          onProgressChange: setProgress,
        })
        imageUrl = res.url

        await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SAVE_IMAGE',
            roomId,
            imageUrl,
          }),
        })
      }

      setNotification('Salle créée avec succès !')
      await fetchRooms()

      setName('')
      setCapacity('')
      setDescription('')
      setFile(null)
      setProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error(err)
      setNotification('Erreur serveur lors de la création')
    }
  }

  const handleDelete = async (roomId: string, imageUrl?: string) => {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette salle ?')
    if (!confirmed) return

    try {
      if (imageUrl) await edgestore.publicFiles.delete({ url: imageUrl })

      const response = await fetch('/api/rooms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      })

      const result = await response.json()

      if (response.ok) {
        setNotification('Salle supprimée avec succès !')
        await fetchRooms()
      } else {
        setNotification(`Erreur suppression: ${result.message}`)
      }
    } catch (err) {
      console.error(err)
      setNotification('Erreur serveur lors de la suppression')
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [companyId])

  return (
    <Wrapper>
      {notification && <Notification message={notification} onclose={closeNotification} />}

      {loading ? (
        <div className="text-center mt-32">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div>
          <div className="badge badge-secondary badge-outline mb-2">{companyName}</div>
          <div className="flex flex-col-reverse md:flex-row">
            <section className="w-full">
              <h1 className="text-2xl font-bold mb-4">Liste des salles</h1>
              <ul>
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <li key={room.roomId} className="flex flex-col md:flex-row md:items-center mb-5 border p-5 rounded-2xl">
                      <Image
                        src={room.imageUrl || '/placeholder.jpg'}
                        alt={room.name}
                        width={400}
                        height={400}
                        className="shadow-sm w-full mb-4 md:mb-0 md:w-1/3 md:h-full object-cover rounded-xl"
                      />
                      <div className="md:ml-4 md:w-2/3">
                        <div className="flex items-center">
                          <div className="badge badge-secondary">
                            <Users className="mr-2 w-4" />
                            {room.capacity}
                          </div>
                          <h1 className="font-bold text-xl ml-2">{room.name}</h1>
                        </div>
                        <p className="text-sm my-2 text-gray-500">{room.description}</p>
                        <button
                          type="button"
                          onClick={() => handleDelete(room.roomId, room.imageUrl)}
                          className="btn mt-2 btn-secondary btn-outline btn-sm"
                        >
                          <Trash2 className="w-4" />
                        </button>
                      </div>
                    </li>
                  ))
                ) : (
                  <p>Aucune salle pour cette entreprise.</p>
                )}
              </ul>
            </section>

            <section className="w-full md:w-[450px] ml-0 md:ml-8">{renderForm()}</section>
          </div>
        </div>
      )}
    </Wrapper>
  )

  function renderForm() {
    return (
      <section className="w-full">
        <h1 className="text-2xl mb-4">Créer une Salle</h1>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la salle"
          className="input input-bordered w-full mb-4"
        />
        <input
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="Capacité"
          className="input input-bordered w-full mb-4"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="textarea textarea-bordered w-full mb-4"
        ></textarea>

        <div className="p-5 rounded-lg bg-secondary/5 border border-base-300">
          <FileUpload onFilechange={handleFileChange} buttonLabel="Image de la Salle" />
          {file && (
            <div className="border border-base-300 p-3 mt-4 rounded-lg">
              <span className="text-sm">{file.name}</span>
              {progress > 0 && (
                <div>
                  <progress className="progress progress-secondary w-56" value={progress} max="100" />
                  <span className="text-sm">{progress}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        <button type="button" className="btn mt-4 btn-secondary btn-outline btn-sm" onClick={handleUpload}>
          Créer Salle
        </button>
      </section>
    )
  }
}
