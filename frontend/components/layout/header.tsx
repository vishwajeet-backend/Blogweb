"use client"

import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/context/AuthContext"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Blog", href: "/blog" },
    { name: "Saved", href: "/saved" },
    { name: "Documentation", href: "/docs" },
  ]

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.05)'
    }}>
      <nav style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px'
      }}>
        {/* Logo */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textDecoration: 'none'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            backgroundColor: '#FF7A33',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.3) 50%)',
              position: 'absolute'
            }}></div>
          </div>
          <span style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#FF7A33',
            letterSpacing: '-0.03em'
          }}>
            PublishType
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex" style={{
          alignItems: 'center',
          gap: '40px',
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#444',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#111'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#444'}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex" style={{
          alignItems: 'center',
          gap: '24px'
        }}>
          {user ? (
            <Link href="/dashboard">
              <button style={{
                padding: '10px 24px',
                backgroundColor: '#FF7A33',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 12px rgba(255, 122, 51, 0.2)'
              }}>
                Dashboard
              </button>
            </Link>
          ) : (
            <>
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <span style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#444',
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                }}>
                  Login
                </span>
              </Link>
              <Link href="/signup">
                <button style={{
                  padding: '12px 32px',
                  backgroundColor: 'white',
                  color: '#FF7A33',
                  border: '1px solid #FF7A33',
                  borderRadius: '50px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}>
                  Signup
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px'
          }}
        >
          {mobileMenuOpen ? <X style={{ height: '24px', width: '24px' }} /> : <Menu style={{ height: '24px', width: '24px' }} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden" style={{
          borderTop: '1px solid #f0f0f0',
          backgroundColor: 'white'
        }}>
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                style={{
                  padding: '12px 16px',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#333',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {user ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <button style={{
                    width: '100%',
                    padding: '12px 24px',
                    backgroundColor: '#FF5722',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}>
                    Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button style={{
                      width: '100%',
                      padding: '12px 24px',
                      backgroundColor: 'transparent',
                      color: '#333',
                      border: '1px solid #ddd',
                      borderRadius: '50px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      Log In
                    </button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <button style={{
                      width: '100%',
                      padding: '12px 24px',
                      backgroundColor: '#FF5722',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      Sign up
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
