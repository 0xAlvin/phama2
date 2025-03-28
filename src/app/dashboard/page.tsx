import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { auth } from '@/lib/auth';
import styles from './dashboard.module.css';

async function Dashboard() {
    const session = await auth();

    return(
    <DashboardLayout>
        {session?.user ? (
            <div className={styles.dashboard}>
                <h1>Welcome, {session.user.name}!</h1>
                <p>Your email is {session.user.email}</p>
                <p>Your role is {session.user.role}</p>
                
            </div>
        ) : (
            <div className={styles.dashboard}>
                <h1>Dashboard</h1>
                
                
            </div>
        )}

    </DashboardLayout>
    )
}

export default Dashboard;