import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import styles from '../dashboard.module.css'; // You can reuse or create a new module

const UsersPage = () => {
  return (
    <DashboardLayout>
      <div className={styles.usersPage}>
        <h1>Manage Users</h1>
        {/* Your user management UI components will go here */}
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              {/* Add more columns */}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>John Doe</td>
              <td>john.doe@example.com</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Jane Smith</td>
              <td>jane.smith@example.com</td>
            </tr>
            {/* Render user data dynamically */}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;