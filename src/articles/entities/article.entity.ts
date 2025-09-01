import { ArticleStatus } from '../dto/create-article.dto';
// import { User } from 'src/user/entities/user.entity'; // Uncomment if User entity is available

export class Article {
  id: string;
  authorId?: string;
  titleIndonesian?: string;
  titleEnglish?: string;
  contentIndonesian?: string;
  contentEnglish?: string;
  categoryIndonesian?: string;
  categoryEnglish?: string;
  thumbnailUrl?: string;
  // author?: User; // Uncomment if User entity is available
  tags: string[];
  highlighted: boolean;
  views: number;
  status: ArticleStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
