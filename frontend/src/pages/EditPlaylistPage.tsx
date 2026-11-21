import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import {
  usePlaylist,
  useUpdatePlaylist,
  useDeletePlaylist,
} from '../hooks/usePlaylists'

export default function EditPlaylistPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const playlistId = Number(id)

  const { data: playlist, isLoading } = usePlaylist(playlistId)
  const updatePlaylist = useUpdatePlaylist()
  const deletePlaylist = useDeletePlaylist()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    if (playlist) {
      setName(playlist.name)
      setDescription(playlist.description ?? '')
      setIsPublic(playlist.isPublic)
    }
  }, [playlist])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updatePlaylist.mutate(
      { id: playlistId, name, description, isPublic },
      { onSuccess: () => navigate(`/app/playlists/${id}`) }
    )
  }

  const handleDelete = () => {
    if (!window.confirm('Delete this playlist? This cannot be undone.')) return
    deletePlaylist.mutate(playlistId, {
      onSuccess: () => navigate('/app/playlists'),
    })
  }

  if (isLoading) {
    return <div className="text-sm text-text-muted">Loading playlist...</div>
  }

  if (!playlist) {
    return <div className="text-sm text-text-muted">Playlist not found.</div>
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <PageHeader
        title="Edit playlist"
        description="Name, description and visibility."
        actions={
          <button
            onClick={() => navigate(`/app/playlists/${id}`)}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        }
      />

      <form onSubmit={handleSave} className="card space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
            Playlist Title
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-field text-sm resize-none"
          />
        </div>

        <div className="flex items-center justify-between py-3 border-t border-bg-border">
          <div>
            <div className="text-sm font-semibold text-text-primary">Public Visibility</div>
            <div className="text-xs text-text-muted">Allow playlist to be discovered across platforms</div>
          </div>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4 rounded text-brand focus:ring-brand"
          />
        </div>

        <div className="pt-4 border-t border-bg-border flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-accent-red hover:underline flex items-center gap-1"
          >
            <Trash2 size={14} />
            <span>Delete Playlist</span>
          </button>

          <button
            type="submit"
            disabled={updatePlaylist.isPending}
            className="btn-primary text-xs px-5 py-2 flex items-center gap-2"
          >
            <Save size={14} />
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  )
}