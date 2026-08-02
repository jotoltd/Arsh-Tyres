import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ArrowLeft, MapPin, Phone, Clock, Mail, MessageSquare, Send, Check, Car, Train, Bus, Navigation } from 'lucide-react';

export default function ContactPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in your name, email, and message');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      if (isSupabaseConfigured()) {
        const { error: supaError } = await supabase.from('contact_messages').insert({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          subject: subject.trim() || 'General Enquiry',
          message: message.trim(),
          status: 'new',
        });
        if (supaError) throw supaError;
      } else {
        const existing = JSON.parse(localStorage.getItem('arsh_contact_messages') || '[]');
        existing.push({
          id: 'msg' + Date.now(),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          subject: subject.trim() || 'General Enquiry',
          message: message.trim(),
          status: 'new',
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('arsh_contact_messages', JSON.stringify(existing));
      }
      setSubmitted(true);
      setName(''); setEmail(''); setPhone(''); setSubject(''); setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again or call us.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-bright-snow font-sans antialiased pb-20 sm:pb-8">
      {/* Header */}
      <header className="bg-black/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-bright-snow/60 hover:text-bright-snow transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold">Back to Home</span>
          </button>
          <h1 className="font-display font-black text-xl text-bright-snow">Contact Us</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
        <div className="space-y-8">
          {/* Page intro */}
          <div className="text-center">
            <h2 className="font-display font-black text-3xl sm:text-4xl text-bright-snow mb-2">Get In Touch</h2>
            <p className="text-sm text-bright-snow/60 max-w-lg mx-auto">
              Questions about tyres, bookings, or anything else? Send us a message and we'll get back to you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-[#1e2121] rounded-2xl border border-white/5 shadow-lg p-6">
              <h3 className="font-display font-bold text-lg text-bright-snow mb-1 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-racing-red" />
                Send a Message
              </h3>
              <p className="text-xs text-bright-snow/60 mb-5">We'll reply as soon as possible.</p>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500/30">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="font-display font-bold text-bright-snow text-lg mb-1">Message Sent!</h4>
                  <p className="text-sm text-bright-snow/60 mb-4">Thanks for reaching out. We'll get back to you shortly.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-racing-red hover:text-racing-red/80 text-sm font-bold transition"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-racing-red/10 border border-racing-red/20 rounded-lg p-3 text-xs text-racing-red font-semibold">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-[11px] text-bright-snow/60 mb-1 font-semibold uppercase">Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 text-bright-snow rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-bright-snow/60 mb-1 font-semibold uppercase">Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-bright-snow rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-bright-snow/60 mb-1 font-semibold uppercase">Phone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-bright-snow rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition"
                        placeholder="07123 456789"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-bright-snow/60 mb-1 font-semibold uppercase">Subject</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 text-bright-snow rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition"
                    >
                      <option value="">Select a topic...</option>
                      <option value="Tyre Enquiry">Tyre Enquiry</option>
                      <option value="Booking Question">Booking Question</option>
                      <option value="Pricing">Pricing</option>
                      <option value="Complaint">Complaint</option>
                      <option value="General Enquiry">General Enquiry</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-bright-snow/60 mb-1 font-semibold uppercase">Message *</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="w-full bg-black/40 border border-white/10 text-bright-snow rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-racing-red hover:bg-racing-red/90 disabled:opacity-50 text-bright-snow font-extrabold uppercase tracking-wider text-sm px-5 py-3.5 rounded-xl transition shadow-lg shadow-racing-red/30"
                  >
                    {submitting ? (
                      <>Sending...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* How to Find Us */}
            <div className="space-y-6">
              {/* Contact details */}
              <div className="bg-[#1e2121] rounded-2xl border border-white/5 shadow-lg p-6">
                <h3 className="font-display font-bold text-lg text-bright-snow mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-racing-red" />
                  How to Find Us
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-racing-red shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-bright-snow">Arsh Autos</p>
                      <p className="text-sm text-bright-snow/60">5 Rowan Rd<br />London<br />SW16 5JF</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-racing-red shrink-0" />
                    <a href="tel:02084271234" className="text-sm text-bright-snow hover:text-racing-red transition font-bold">020 8427 1234</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-racing-red shrink-0" />
                    <a href="mailto:arshtyres25@gmail.com" className="text-sm text-bright-snow hover:text-racing-red transition font-bold">arshtyres25@gmail.com</a>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-racing-red shrink-0 mt-0.5" />
                    <div className="text-sm text-bright-snow/60">
                      <p><span className="font-bold text-bright-snow">Mon – Fri:</span> 8:30am – 6:00pm</p>
                      <p><span className="font-bold text-bright-snow">Saturday:</span> 8:30am – 6:00pm</p>
                      <p><span className="font-bold text-bright-snow/40">Sunday:</span> Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="bg-[#1e2121] rounded-2xl border border-white/5 shadow-lg overflow-hidden">
                <div className="h-64 w-full">
                  <iframe
                    src="https://maps.google.com/maps?q=5%20Rowan%20Rd%20London%20SW16%205JF&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    className="w-full h-full"
                    style={{ border: 0, filter: 'invert(0.9) hue-rotate(180deg) contrast(0.8)' }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allow="fullscreen"
                    title="Arsh Autos Location Map"
                  />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <p className="text-xs text-bright-snow/60">5 Rowan Rd, London SW16 5JF</p>
                  <a
                    href="https://maps.google.com/maps?daddr=5+Rowan+Rd+London+SW16+5JF"
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-1.5 text-xs font-bold text-racing-red hover:text-racing-red/80 transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Get Directions
                  </a>
                </div>
              </div>

              {/* Travel info */}
              <div className="bg-[#1e2121] rounded-2xl border border-white/5 shadow-lg p-6">
                <h3 className="font-display font-bold text-base text-bright-snow mb-4">Getting Here</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Car className="w-4 h-4 text-racing-red shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-bright-snow">By Car</p>
                      <p className="text-xs text-bright-snow/60">Located on Rowan Rd just off Streatham High Road. Street parking available nearby.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Train className="w-4 h-4 text-racing-red shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-bright-snow">By Train</p>
                      <p className="text-xs text-bright-snow/60">Streatham Common station is a 10-minute walk. Streatham station is 15 minutes.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Bus className="w-4 h-4 text-racing-red shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-bright-snow">By Bus</p>
                      <p className="text-xs text-bright-snow/60">Routes 50, 60, 118, 159 and 249 stop on Streatham High Road, a short walk away.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
