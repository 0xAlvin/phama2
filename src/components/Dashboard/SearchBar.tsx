import React from 'react';
import styles from './dashstyles/dashboardLayout.module.css';
import { Search } from 'lucide-react';

const SearchBar = () => {
    return (
        <form className={styles.searchForm}>
            <input
                type="text"
                className={styles.searchInput}
                placeholder="Search..."
                aria-label="Search"
            />
            <button type="submit" className={styles.searchButton}>
                <Search size={18} className={styles.searchIcon} />
            </button>
        </form>
    );
};

export default SearchBar;
