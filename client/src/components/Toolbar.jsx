import "../App.css"; // keep your styles

const Toolbar = ({
    searchQuery,
    onSearchChange,
    searchLabel = "Zoek",

    sort,
    sortDirection,
    onSortChange,
    onSortDirectionChange,
    sortOptions,

    filter,
    onFilterChange,
    filterOptions,
}) => {
    return (
        <div className="toolbar">
            {/* Search */}
            <div className="toolbar-group">
                <label htmlFor="search">Zoek</label>
                <input
                    id="search"
                    type="text"
                    placeholder={searchLabel}
                    value={searchQuery}
                    onChange={onSearchChange}
                    className="search-bar"
                />
            </div>

            {/* Sort */}
            <div className="toolbar-group">
                <label htmlFor="sort">Sorteren</label>
                <select id="sort" value={sort} onChange={onSortChange}>
                    {sortOptions?.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <select id="sortDirection" value={sortDirection} onChange={onSortDirectionChange}>
                    <option value="ascending">Oplopend</option>
                    <option value="descending">Aflopend</option>
                </select>
            </div>

            {/* Filter */}
            <div className="toolbar-group">
                <label htmlFor="filter">Filter</label>
                <select id="filter" value={filter} onChange={onFilterChange}>
                    <option value="none">Geen filter</option>

                    {/* dynamic optgroups */}
                    {filterOptions.map(group => (
                        <optgroup key={group.id} label={group.label} id={group.id}>
                            {group.options.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label || opt.value}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default Toolbar;
