import React from 'react';

type Props = {
    children?: React.ReactNode;
    className?: string;
};

export const FieldFeedback: React.FC<Props> = ({ children, className }) => {
    const cls = `invalid-feedback ${className ?? ""}`.trim();
    return <div className={cls}>{children}</div>;
};

export default FieldFeedback;
