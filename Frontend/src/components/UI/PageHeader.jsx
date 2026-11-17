import React from 'react';
import { Space, Typography, Breadcrumb, Input, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Title } = Typography;

/**
 * A reusable Page Header component for directory lists and dashboards.
 * 
 * @param {string} title - The page title.
 * @param {Array} breadcrumbItems - Array of objects for Breadcrumb: [{ title: 'Home' }, { title: 'List' }]
 * @param {string} searchText - Value for the search input.
 * @param {function} onSearchChange - Callback for search input change.
 * @param {string} searchPlaceholder - Placeholder text for search input.
 * @param {string} actionButtonText - Text for the primary action button.
 * @param {function} onActionClick - Callback for primary action button click.
 * @param {ReactNode} actionButtonIcon - Icon for the primary action button.
 * @param {boolean} showActionButton - Whether to show the action button (usually permission-based).
 * @param {ReactNode} extraAction - Any additional buttons or components to show in the action area.
 */
const PageHeader = ({
    title,
    breadcrumbItems = [],
    searchText,
    onSearchChange,
    searchPlaceholder = "Search...",
    actionButtonText,
    onActionClick,
    actionButtonIcon,
    showActionButton = true,
    extraAction = null
}) => {
    return (
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Space direction="vertical" size={0}>
                <Title level={2} className="m-0 text-slate-800 font-bold tracking-tight">{title}</Title>
                <Breadcrumb items={breadcrumbItems} className="text-slate-400 text-sm" />
            </Space>

            <Space size="middle" className="flex-wrap items-center">

                {extraAction}

                {onSearchChange && (
                    <Input
                        placeholder={searchPlaceholder}
                        prefix={<SearchOutlined className="text-slate-400" />}
                        value={searchText}
                        onChange={onSearchChange}
                        className="w-full md:w-80 h-11 rounded-xl border-slate-200 shadow-sm focus:border-blue-500"
                        allowClear
                    />
                )}

                {showActionButton && actionButtonText && (
                    <Button
                        type="primary"
                        size="large"
                        icon={actionButtonIcon}
                        onClick={onActionClick}
                        className="bg-blue-600 h-11 px-8 rounded-xl shadow-lg shadow-blue-200 border-none hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all font-semibold"
                    >
                        {actionButtonText}
                    </Button>
                )}

            </Space>
        </div>
    );
};

export default PageHeader;
