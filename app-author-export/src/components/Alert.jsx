import { Alert } from 'react-bootstrap';

function AlertDismissible({ type = 'danger', msg = '', onClose }) {

    if (msg !== '') {
        return (
            <Alert variant={type} onClose={onClose} className="opacity1" dismissible>
                {msg}
            </Alert>
        );
    }
    return '';
}

export default AlertDismissible;
