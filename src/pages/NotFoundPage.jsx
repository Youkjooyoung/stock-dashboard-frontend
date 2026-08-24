import { useNavigate } from 'react-router-dom';
import PageState from '../components/PageState';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="standalone-page-shell">
      <PageState
        title="요청한 화면을 찾을 수 없어요"
        description="주소가 변경되었거나 삭제된 화면입니다. 대시보드에서 다시 시작해 주세요."
        actionLabel="대시보드로 이동"
        onAction={() => navigate('/')}
      />
    </main>
  );
}
