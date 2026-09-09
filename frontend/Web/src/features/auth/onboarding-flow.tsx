'use client';

import { Check, ChevronRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { authRepository } from '@/repositories/auth.repository';
import { onboardingRepository } from '@/repositories/onboarding.repository';
import { useAppStore } from '@/stores/app-store';
import { useSessionStore } from '@/stores/session-store';

const steps = ['Profile', 'Professional', 'Chamber', 'Schedule', 'Staff', 'AI setup'];

export function OnboardingFlow() {
  const router = useRouter();
  const { accessToken, user, setOnboarding } = useSessionStore();
  const setChamber = useAppStore((s) => s.setSelectedChamber);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [chamberId, setChamberId] = useState('');
  const next = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      if (step === 0)
        await onboardingRepository.updateProfile(accessToken, {
          fullName: String(form.get('fullName')),
          designation: String(form.get('designation')) || undefined,
        });
      if (step === 1)
        await onboardingRepository.updateProfessional(accessToken, {
          specialization: String(form.get('specialization')),
          qualifications: String(form.get('qualification'))
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
          bmdcNumber: String(form.get('bmdcNumber')) || undefined,
          yearsOfExperience: Number(form.get('experience')) || undefined,
        });
      if (step === 2) {
        const chamber = await onboardingRepository.createChamber(accessToken, {
          name: String(form.get('name')),
          address: { area: String(form.get('area')), city: String(form.get('city')) },
          consultationFee: Number(form.get('fee')) || 0,
          timezone: 'Asia/Dhaka',
          currency: 'BDT',
        });
        setChamberId(chamber.id);
        setChamber(chamber.id, chamber.name);
      }
      if (step === 3 && chamberId)
        await onboardingRepository.createSchedule(accessToken, chamberId, {
          dayOfWeek: Number(form.get('day')),
          startTime: String(form.get('start')),
          endTime: String(form.get('end')),
          slotDurationMinutes: 15,
          maxPatients: 30,
        });
      if (step === 4 && chamberId && String(form.get('phone')))
        await onboardingRepository.inviteStaff(accessToken, chamberId, {
          phone: String(form.get('phone')),
          role: form.get('role') as 'RECEPTIONIST',
        });
      if (step === 5) {
        const progress = await authRepository.onboarding(accessToken);
        setOnboarding(progress);
        router.replace('/dashboard');
        return;
      }
      setStep((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save this step.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="onboarding-page">
      <section className="onboarding-card">
        <div className="onboarding-brand">
          <span>✚</span>
          <b>CareChamber</b>
        </div>
        <div className="onboarding-progress">
          {steps.map((label, index) => (
            <div className={index <= step ? 'active' : ''} key={label}>
              <i>{index < step ? <Check /> : index + 1}</i>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="onboarding-content">
          <p className="onboarding-kicker">
            Step {step + 1} of {steps.length}
          </p>
          <h1>
            {
              [
                'Tell us about yourself',
                'Your professional details',
                'Create your first chamber',
                'Set your consulting hours',
                'Invite your team',
                'AI assistance preferences',
              ][step]
            }
          </h1>
          <p>
            {
              [
                'This helps patients recognize the doctor behind the chamber.',
                'Add the information used in your public professional profile.',
                'Your chamber is where appointments, patients, and staff come together.',
                'Add one weekly slot now; you can add more in Chamber Settings.',
                'Invite a receptionist or assistant now, or safely skip this step.',
                'Choose how CareChamber should prepare AI assistance. Clinical outputs always require your review.',
              ][step]
            }
          </p>
          <form onSubmit={next}>
            {step === 0 && (
              <>
                <label>
                  Full name
                  <Input name="fullName" defaultValue={user?.fullName} required />
                </label>
                <label>
                  Designation
                  <Input name="designation" placeholder="e.g. Consultant Physician" />
                </label>
              </>
            )}
            {step === 1 && (
              <>
                <label>
                  Specialization
                  <Input name="specialization" placeholder="e.g. Internal Medicine" required />
                </label>
                <label>
                  Qualifications
                  <Input name="qualification" placeholder="MBBS, FCPS" />
                </label>
                <label>
                  BMDC registration number
                  <Input name="bmdcNumber" />
                </label>
                <label>
                  Years of experience
                  <Input name="experience" type="number" min="0" />
                </label>
              </>
            )}
            {step === 2 && (
              <>
                <label>
                  Chamber name
                  <Input name="name" placeholder="e.g. City Care Chamber" required />
                </label>
                <label>
                  Area
                  <Input name="area" placeholder="Dhanmondi" />
                </label>
                <label>
                  City
                  <Input name="city" defaultValue="Dhaka" />
                </label>
                <label>
                  Consultation fee (BDT)
                  <Input name="fee" type="number" min="0" />
                </label>
              </>
            )}
            {step === 3 && (
              <>
                <label>
                  Day
                  <Select name="day" defaultValue="0">
                    <option value="0">Sunday</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </Select>
                </label>
                <div className="onboarding-two">
                  <label>
                    Start time
                    <Input name="start" type="time" defaultValue="09:00" required />
                  </label>
                  <label>
                    End time
                    <Input name="end" type="time" defaultValue="17:00" required />
                  </label>
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <label>
                  Staff mobile number <small>(optional)</small>
                  <Input name="phone" placeholder="01XXXXXXXXX" />
                </label>
                <label>
                  Role
                  <Select name="role">
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="ASSISTANT_DOCTOR">Assistant doctor</option>
                    <option value="CHAMBER_MANAGER">Chamber manager</option>
                  </Select>
                </label>
              </>
            )}
            {step === 5 && (
              <div className="onboarding-ai">
                <Sparkles />
                <div>
                  <strong>AI assistance enabled</strong>
                  <p>Drafts, summaries, and suggestions will be marked for clinician review.</p>
                </div>
              </div>
            )}
            {error && <p className="auth-server-error">{error}</p>}
            <div className="onboarding-actions">
              {step > 0 && (
                <Button type="button" variant="secondary" onClick={() => setStep((v) => v - 1)}>
                  Back
                </Button>
              )}
              <Button type="submit" disabled={busy}>
                {busy ? (
                  'Saving…'
                ) : step === 5 ? (
                  'Finish setup'
                ) : (
                  <>
                    Continue <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
