import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Button from '@material-ui/core/Button';
import Hidden from '@material-ui/core/Hidden';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import { makeStyles } from '@material-ui/core/styles';

import { NameCard } from './utils';

import {
  getSuggestionsAction,
  getAllPostsAction,
  followAction
} from '../../redux/actions/api';

import { SuggestionsSkeleton, AllPostsSkeleton } from '../utils/skeleton';
import { generateKey, Loader, LinearLoader, UnfollowDialog } from '../utils';

import LoadingPage from '../LoadingPage';

const Post = lazy(() => import('./Post'));

export default function Feed() {
  const dispatch = useDispatch();
  const allPosts = useSelector(state => state.api.allPosts);

  useEffect(() => {
    dispatch(getAllPostsAction());
  }, [dispatch]);

  if (!allPosts) {
    return <LoadingPage />;
  }

  if (allPosts.length === 0) {
    return <SuggestionsCard />;
  }

  return <AllPosts posts={allPosts} />;
}

const useAllPostsStyles = makeStyles(theme => ({
  container: {
    display: 'grid',
    gridAutoFlow: 'column',
    gridTemplateColumns: 'minmax(auto, 600px) 300px',
    gridGap: 35,
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: 'minmax(auto, 600px)',
      justifyContent: 'center'
    }
  },

  wrapper: {
    display: 'grid',
    margin: '0px 28px 24px',
    justifyContent: 'center',
    gridTemplateColumns: 'minmax(auto, 300px)'
  }
}));

function AllPosts({ posts }) {
  const classes = useAllPostsStyles();
  const user = useSelector(state => state.api.user);

  return (
    <div className={classes.container}>
      <div>
        {posts.map(post => (
          <Suspense fallback={<AllPostsSkeleton count={5} />} key={post.id}>
            <Post post={post} />
          </Suspense>
        ))}
      </div>
      <Hidden smDown>
        <div>
          <div className={classes.wrapper}>
            <NameCard
              userName={user && user.userName}
              fullName={user && user.fullName}
              profileImageUrl={user && user.profileImageUrl}
            />
          </div>
          <SuggestionsCard side={true} />
        </div>
      </Hidden>
    </div>
  );
}

const useSuggestionsCardStyles = makeStyles(theme => ({
  article: {
    margin: '0 12px',
    display: 'grid',
    gridTemplateColumns: 'minmax(auto, 600px)',
    justifyContent: 'center'
  },
  typographyHeading: {
    [theme.breakpoints.down('xs')]: {
      fontSize: '1rem'
    }
  },

  paper: {
    padding: '8px 0px'
  },

  buttonWrapper: {
    padding: 16
  }
}));

function SuggestionsCard({ side = false }) {
  const classes = useSuggestionsCardStyles();
  const dispatch = useDispatch();
  const suggestions = useSelector(({ api }) => api.suggestions);
  const [showButton, setButton] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const data = suggestions.data;

  useEffect(() => {
    dispatch(getSuggestionsAction());
  }, [dispatch]);

  useEffect(() => {
    if (data && !side) {
      const isFollowingAnyone = data.some(friend => friend.ownerIsFollowing);
      if (isFollowingAnyone) {
        setButton(true);
      } else {
        setButton(false);
      }
    }
  }, [side, data]);

  const typographyProps = {
    variant: 'h6',
    align: 'left',
    gutterBottom: true,
    className: classes.typographyHeading
  };
  const typographyPropsSide = {
    align: 'center',
    gutterBottom: true,
    color: 'textSecondary',
    variant: 'subtitle2'
  };
  const buttonProps = {
    disabled,
    variant: 'contained',
    color: 'primary',
    fullWidth: true,
    onClick: () => {
      setDisabled(true);
      dispatch(getAllPostsAction());
    }
  };

  return (
    <article className={classes.article}>
      {!side && (
        <Typography {...typographyProps}>Suggestions For You</Typography>
      )}
      <Paper className={classes.paper}>
        {side && (
          <Typography {...typographyPropsSide}>Suggestions For You</Typography>
        )}
        {data ? (
          data.map(friend => {
            const customUsersListCardItemProps = {
              friend,
              key: friend.id,
              list: suggestions,
              side
            };
            return (
              <CustomUsersListCardItem {...customUsersListCardItemProps} />
            );
          })
        ) : (
          <SuggestionsSkeleton count={12} />
        )}
        {showButton && (
          <div className={classes.buttonWrapper}>
            <Button {...buttonProps}>Get Started</Button>
          </div>
        )}
        {disabled && <LinearLoader />}
      </Paper>
    </article>
  );
}

const useCustomUsersListCardItemStyles = makeStyles({
  card: {
    display: 'grid',
    gridAutoFlow: 'column',
    gridTemplateColumns: 'minmax(auto, 500px)',
    gridGap: 10,
    alignItems: 'center',
    padding: '8px 16px'
  },

  button: {
    height: 30,
    padding: '0px 16px'
  }
});

export function CustomUsersListCardItem({
  friend: {
    id,
    profileImageUrl,
    userName,
    fullName,
    ownerIsFollowing,
    isOwner = false,
    isFollowingOwner = false
  },
  list,
  side,
  namespace = '',
  postId
}) {
  const classes = useCustomUsersListCardItemStyles();
  const dispatch = useDispatch();
  const { current: key } = useRef(generateKey());
  const [loading, setLoading] = useState(false);
  const [loadingUnfollow, setLoadingUnfollow] = useState(false);
  const [dialog, setDialog] = useState(false);

  useEffect(() => {
    if (list.key === key) {
      setLoading(false);
      setLoadingUnfollow(false);
    }
  }, [key, list]);

  const handleDialogClick = bool => () => setDialog(bool);

  const handleFollowButtonClick = () => {
    setLoading(true);
    dispatch(
      followAction({
        key,
        params: id,
        payload: { follow: true },
        namespace,
        postId
      })
    );
  };
  const handleUnfollowButtonClick = () => {
    setDialog(false);
    setLoadingUnfollow(true);
    dispatch(
      followAction({
        key,
        params: id,
        payload: { follow: false },
        namespace,
        postId
      })
    );
  };

  const followButtonProps = {
    disabled: loading,
    variant: !side ? 'contained' : 'text',
    color: 'primary',
    className: classes.button,
    onClick: handleFollowButtonClick
  };
  const followingButtonProps = {
    disabled: loadingUnfollow,
    variant: !side ? 'outlined' : 'text',
    className: classes.button,
    onClick: handleDialogClick(true)
  };
  const unfollowDialogProps = {
    userName,
    onClose: handleDialogClick(false),
    profileImageUrl,
    handleUnfollowButtonClick
  };
  const followingButton = (
    <Button {...followingButtonProps}>
      {loadingUnfollow && <Loader />}Following
    </Button>
  );
  const followButton = (
    <Button {...followButtonProps}>
      {loading && <Loader color="blue" />}
      {isFollowingOwner ? 'Follow Back' : 'Follow'}
    </Button>
  );

  let button;
  if (!isOwner) {
    button = ownerIsFollowing ? followingButton : followButton;
  }

  return (
    <div className={classes.card}>
      <NameCard
        profileImageUrl={profileImageUrl}
        userName={userName}
        fullName={fullName}
      />
      {button}
      {dialog && <UnfollowDialog {...unfollowDialogProps} />}
    </div>
  );
}
