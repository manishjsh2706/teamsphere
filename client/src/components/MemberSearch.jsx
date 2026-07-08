import { useState, useRef, useEffect } from 'react'

// ─────────────────────────────────────────
// MEMBER SEARCH COMPONENT
// A searchable dropdown for selecting
// a project member to assign a task to
// ─────────────────────────────────────────
const MemberSearch = ({
  members,        // array of project members from currentProject.members
  value,          // currently selected member ID
  onChange,       // callback when member is selected (sends member ID)
  label,          // label text above the field
}) => {

  // Search input text
  const [searchText, setSearchText] = useState('')

  // Show or hide the dropdown suggestions
  const [showDropdown, setShowDropdown] = useState(false)

  // Ref for the whole component
  // Used to close dropdown when clicking outside
  const containerRef = useRef(null)

  // ─────────────────────────────────────────
  // DERIVED VALUES
  // ─────────────────────────────────────────

  // Find the currently selected member object
  // so we can show their name and avatar
  const selectedMember = members?.find(
    (m) => m.user?._id === value
  )

  // Filter members based on search text
  // Shows members whose name or email contains the search text
  const filteredMembers = members?.filter((m) => {
    if (!searchText.trim()) return true
    // If search is empty, show all members

    const search = searchText.toLowerCase()
    const name = m.user?.name?.toLowerCase() || ''
    const email = m.user?.email?.toLowerCase() || ''

    return name.includes(search) || email.includes(search)
    // Returns true if name OR email matches search text
  })

  // ─────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────

  // Close dropdown when clicking outside the component
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false)
        setSearchText('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ─────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────

  // When user selects a member from the list
  const handleSelect = (member) => {
    onChange(member.user?._id)
    // Send selected member's ID to parent
    setSearchText('')
    setShowDropdown(false)
  }

  // When user clears the selection
  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    // Send empty string = unassigned
    setSearchText('')
    setShowDropdown(false)
  }

  // When user opens the search
  const handleOpen = () => {
    setShowDropdown(true)
    setSearchText('')
    // Clear search so all members show when first opened
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div ref={containerRef} style={{ position: 'relative' }}>

      {/* Label */}
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '6px',
          }}
        >
          {label}
        </label>
      )}

      {/* ── TRIGGER BUTTON ── */}
      {/* Shows either selected member OR placeholder */}
      {!showDropdown && (
        <div
          onClick={handleOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            cursor: 'pointer',
            background: 'var(--input-bg)',
            minHeight: '38px',
          }}
        >
          {selectedMember ? (
            // Show selected member with avatar
            <>
              {/* Avatar circle */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '600',
                  flexShrink: 0,
                }}
              >
                {selectedMember.user?.name?.charAt(0).toUpperCase()}
              </div>

              {/* Member name */}
              <span
                style={{
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  fontWeight: '500',
                  flex: 1,
                }}
              >
                {selectedMember.user?.name}
              </span>

              {/* Clear button — removes assignee */}
              <button
                onClick={handleClear}
                title="Remove assignee"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  fontSize: '14px',
                  padding: '0',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </>
          ) : (
            // Show placeholder when no member selected
            <>
              <span style={{ fontSize: '16px' }}>👤</span>
              <span
                style={{
                  fontSize: '13px',
                  color: 'var(--text-tertiary)',
                  flex: 1,
                }}
              >
                Search and assign a member...
              </span>
              {/* Dropdown arrow */}
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                }}
              >
                ▼
              </span>
            </>
          )}
        </div>
      )}

      {/* ── SEARCH INPUT ── */}
      {/* Shows when dropdown is open */}
      {showDropdown && (
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Type a name to search..."
          autoFocus
          // autoFocus opens keyboard immediately
          style={{
            width: '100%',
            padding: '8px 10px',
            border: '2px solid #3b82f6',
            // Blue border when active — like Jira
            borderRadius: '8px',
            fontSize: '13px',
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}

      {/* ── DROPDOWN SUGGESTIONS LIST ── */}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: label ? 'calc(100% + 2px)' : 'calc(100% + 2px)',
            left: 0,
            right: 0,
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            zIndex: 300,
            maxHeight: '200px',
            overflowY: 'auto',
            // Scrollable if many members
          }}
        >
          {/* Unassigned option — always at top */}
          <div
            onClick={() => {
              onChange('')
              setShowDropdown(false)
              setSearchText('')
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              cursor: 'pointer',
              borderBottom: '1px solid var(--border-color)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                border: '2px dashed var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                flexShrink: 0,
              }}
            >
              👤
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--text-secondary)',
                }}
              >
                Unassigned
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                }}
              >
                Remove assignee
              </p>
            </div>
          </div>

          {/* Filtered member list */}
          {filteredMembers?.length === 0 ? (
            // No results found
            <div
              style={{
                padding: '16px 12px',
                textAlign: 'center',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
            >
              No members found for "{searchText}"
            </div>
          ) : (
            filteredMembers?.map((member) => {
              const isSelected = member.user?._id === value
              // Check if this member is currently selected

              return (
                <div
                  key={member.user?._id}
                  onClick={() => handleSelect(member)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    // Highlight currently selected member
                    background: isSelected
                      ? '#EFF6FF'
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--bg-tertiary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {/* Member avatar */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      flexShrink: 0,
                    }}
                  >
                    {member.user?.name?.charAt(0).toUpperCase()}
                  </div>

                  {/* Member name + email */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {member.user?.name}
                      {/* Show role badge next to name */}
                      <span
                        style={{
                          marginLeft: '6px',
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '99px',
                          background: member.role === 'admin'
                            ? '#dbeafe'
                            : 'var(--bg-tertiary)',
                          color: member.role === 'admin'
                            ? '#1d4ed8'
                            : 'var(--text-secondary)',
                          fontWeight: '500',
                        }}
                      >
                        {member.role}
                      </span>
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {member.user?.email}
                    </p>
                  </div>

                  {/* Checkmark for selected member */}
                  {isSelected && (
                    <span
                      style={{
                        color: '#3b82f6',
                        fontSize: '16px',
                        fontWeight: '700',
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default MemberSearch