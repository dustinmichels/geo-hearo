# Data Prep

## Setup

Create conda env from file:

```bash
conda env create -f environment.yml
```

## Dev Notes

### Git Config

So as to not include notebook out in git, and based on this [SO post](https://stackoverflow.com/a/58004619/7576819), I modified the `.git/config`.

```properties
[filter "strip-notebook-output"]
    clean = "jq '.cells[].outputs = [] | .cells[].execution_count = null | .'"
```

And created a `.gitattributes` files with the following content:

```properties
*.ipynb filter=strip-notebook-output
```
