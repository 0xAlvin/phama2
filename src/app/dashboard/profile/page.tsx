import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import styles from '../dashboard.module.css';

const ProfilePage = () => {
  return (
    <DashboardLayout>
      <div className={styles.profilePage}>
        <header className={styles.pageHeader}>
          <h1>User Profile</h1>
          <p>Manage your personal information and account preferences</p>
        </header>
        
        <div className={styles.profileContainer}>
          <section className={styles.profileCard}>
            <h2>Personal Information</h2>
            <div className={styles.profileForm}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" defaultValue="John Doe" className={styles.formInput} />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" defaultValue="john.doe@example.com" className={styles.formInput} />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="phone">Phone Number</label>
                <input type="tel" id="phone" defaultValue="+1 (555) 123-4567" className={styles.formInput} />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="location">Location</label>
                <input type="text" id="location" defaultValue="New York, NY" className={styles.formInput} />
              </div>
              
              <button className={styles.saveButton}>Save Changes</button>
            </div>
          </section>
          
          <section className={styles.profileCard}>
            <h2>Account Security</h2>
            <div className={styles.securityOptions}>
              <div className={styles.securityItem}>
                <div>
                  <h3>Password</h3>
                  <p>Last changed 3 months ago</p>
                </div>
                <button className={styles.actionButton}>Change</button>
              </div>
              
              <div className={styles.securityItem}>
                <div>
                  <h3>Two-Factor Authentication</h3>
                  <p>Currently disabled</p>
                </div>
                <button className={styles.actionButton}>Enable</button>
              </div>
              
              <div className={styles.securityItem}>
                <div>
                  <h3>Login Sessions</h3>
                  <p>1 active session</p>
                </div>
                <button className={styles.actionButton}>Manage</button>
              </div>
            </div>
          </section>
          
          <section className={styles.profileCard}>
            <h2>Preferences</h2>
            <div className={styles.preferencesForm}>
              <div className={styles.switchGroup}>
                <div>
                  <h3>Email Notifications</h3>
                  <p>Receive email updates</p>
                </div>
                <div className={styles.toggle}>
                  <input type="checkbox" id="emailNotif" defaultChecked />
                  <label htmlFor="emailNotif"></label>
                </div>
              </div>
              
              <div className={styles.switchGroup}>
                <div>
                  <h3>Dark Mode</h3>
                  <p>Use dark theme</p>
                </div>
                <div className={styles.toggle}>
                  <input type="checkbox" id="darkMode" />
                  <label htmlFor="darkMode"></label>
                </div>
              </div>
            </div>
          </section>
          
          <section className={styles.profileCard}>
            <h2>Danger Zone</h2>
            <div className={styles.dangerZone}>
              <p>Once you delete your account, there is no going back. Please be certain.</p>
              <button className={styles.dangerButton}>Delete Account</button>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
